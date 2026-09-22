-- =====================================================================
-- StockLink: Multi-Branch Hardware & Tools Inventory Distribution System
-- Migration: 001_init_schema.sql
-- Target: PostgreSQL (Supabase)
-- =====================================================================

-- ---------------------------------------------------------------------
-- Core reference tables
-- ---------------------------------------------------------------------

CREATE TABLE branches (
    branch_id       SERIAL PRIMARY KEY,
    branch_name     VARCHAR(100) NOT NULL,
    location        VARCHAR(200) NOT NULL,
    contact_phone   VARCHAR(30)
);

CREATE TABLE central_warehouse (
    warehouse_id    SERIAL PRIMARY KEY,
    warehouse_name  VARCHAR(100) NOT NULL,
    location        VARCHAR(200) NOT NULL
);

CREATE TABLE users (
    user_id         SERIAL PRIMARY KEY,
    username        VARCHAR(50) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'branch_manager', 'clerk')),
    branch_id       INTEGER REFERENCES branches(branch_id) ON DELETE RESTRICT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE items (
    item_id         SERIAL PRIMARY KEY,
    item_name       VARCHAR(150) NOT NULL,
    category        VARCHAR(80) NOT NULL,
    unit_price      NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
    unit_of_measure VARCHAR(20) NOT NULL DEFAULT 'pcs'
);

CREATE TABLE suppliers (
    supplier_id     SERIAL PRIMARY KEY,
    supplier_name   VARCHAR(150) NOT NULL,
    contact_info    VARCHAR(200)
);

-- ---------------------------------------------------------------------
-- Junction tables (M:N with intersection attributes)
-- ---------------------------------------------------------------------

CREATE TABLE supplier_items (
    supplier_id     INTEGER NOT NULL REFERENCES suppliers(supplier_id) ON DELETE CASCADE,
    item_id         INTEGER NOT NULL REFERENCES items(item_id) ON DELETE RESTRICT,
    unit_cost       NUMERIC(10,2) NOT NULL CHECK (unit_cost >= 0),
    lead_time_days  INTEGER NOT NULL CHECK (lead_time_days >= 0),
    min_order_qty   INTEGER NOT NULL DEFAULT 1 CHECK (min_order_qty > 0),
    PRIMARY KEY (supplier_id, item_id)
);

CREATE TABLE branch_stock (
    branch_id           INTEGER NOT NULL REFERENCES branches(branch_id) ON DELETE RESTRICT,
    item_id             INTEGER NOT NULL REFERENCES items(item_id) ON DELETE RESTRICT,
    quantity            INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    reorder_threshold   INTEGER NOT NULL DEFAULT 5 CHECK (reorder_threshold >= 0),
    last_restocked_at   TIMESTAMP,
    PRIMARY KEY (branch_id, item_id)
);

CREATE TABLE central_stock (
    warehouse_id    INTEGER NOT NULL REFERENCES central_warehouse(warehouse_id) ON DELETE RESTRICT,
    item_id         INTEGER NOT NULL REFERENCES items(item_id) ON DELETE RESTRICT,
    quantity        INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    PRIMARY KEY (warehouse_id, item_id)
);

-- ---------------------------------------------------------------------
-- Transactional / operational tables
-- ---------------------------------------------------------------------

CREATE TABLE restock_requests (
    request_id      SERIAL PRIMARY KEY,
    branch_id       INTEGER NOT NULL REFERENCES branches(branch_id) ON DELETE RESTRICT,
    item_id         INTEGER NOT NULL REFERENCES items(item_id) ON DELETE RESTRICT,
    requested_qty   INTEGER NOT NULL CHECK (requested_qty > 0),
    status          VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'fulfilled', 'rejected')),
    requested_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    fulfilled_at    TIMESTAMP,
    approved_by     INTEGER REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE stock_movements (
    movement_id     SERIAL PRIMARY KEY,
    branch_id       INTEGER NOT NULL REFERENCES branches(branch_id) ON DELETE RESTRICT,
    item_id         INTEGER NOT NULL REFERENCES items(item_id) ON DELETE RESTRICT,
    moved_by        INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    movement_type   VARCHAR(20) NOT NULL CHECK (movement_type IN ('sale', 'withdrawal', 'adjustment')),
    quantity        INTEGER NOT NULL CHECK (quantity > 0),
    moved_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_logs (
    log_id          SERIAL PRIMARY KEY,
    table_name      VARCHAR(50) NOT NULL,
    record_id       INTEGER NOT NULL,
    action          VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_value       JSONB,
    new_value       JSONB,
    changed_by      INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    changed_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- Signature Trigger 1: Auto-generate restock request on low stock
-- Fires whenever branch_stock.quantity is updated (e.g. after a sale
-- logged in stock_movements decrements it) and falls below threshold.
-- =====================================================================

CREATE OR REPLACE FUNCTION fn_check_restock_threshold()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.quantity < NEW.reorder_threshold THEN
        -- avoid spamming duplicate pending requests for the same branch/item
        IF NOT EXISTS (
            SELECT 1 FROM restock_requests
            WHERE branch_id = NEW.branch_id
              AND item_id = NEW.item_id
              AND status = 'pending'
        ) THEN
            INSERT INTO restock_requests (branch_id, item_id, requested_qty, status)
            VALUES (
                NEW.branch_id,
                NEW.item_id,
                GREATEST(NEW.reorder_threshold * 2 - NEW.quantity, 1),
                'pending'
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_branch_stock_low
AFTER UPDATE OF quantity ON branch_stock
FOR EACH ROW
EXECUTE FUNCTION fn_check_restock_threshold();

-- =====================================================================
-- Signature Trigger 2: Automated audit logging
-- Fires on every UPDATE to branch_stock so no application code ever
-- has to remember to log a stock change.
-- =====================================================================

CREATE OR REPLACE FUNCTION fn_audit_branch_stock()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (table_name, record_id, action, old_value, new_value, changed_at)
    VALUES (
        'branch_stock',
        NEW.item_id,
        'UPDATE',
        to_jsonb(OLD),
        to_jsonb(NEW),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_branch_stock
AFTER UPDATE ON branch_stock
FOR EACH ROW
EXECUTE FUNCTION fn_audit_branch_stock();

-- =====================================================================
-- Signature Stored Procedure: Fulfill a restock request
-- Deducts central stock, increments branch stock, marks the request
-- fulfilled -- all inside one atomic transaction block.
-- =====================================================================

CREATE OR REPLACE PROCEDURE sp_fulfill_restock_request(
    p_request_id INTEGER,
    p_warehouse_id INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_branch_id INTEGER;
    v_item_id   INTEGER;
    v_qty       INTEGER;
    v_available INTEGER;
BEGIN
    SELECT branch_id, item_id, requested_qty
      INTO v_branch_id, v_item_id, v_qty
      FROM restock_requests
     WHERE request_id = p_request_id
       AND status = 'pending'
     FOR UPDATE;  -- lock the row to prevent double-fulfillment

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request % not found or already processed', p_request_id;
    END IF;

    SELECT quantity INTO v_available
      FROM central_stock
     WHERE warehouse_id = p_warehouse_id AND item_id = v_item_id
     FOR UPDATE;  -- lock to prevent race condition on concurrent fulfillments

    IF v_available IS NULL OR v_available < v_qty THEN
        RAISE EXCEPTION 'Insufficient central stock for item %', v_item_id;
    END IF;

    -- Deduct from central warehouse
    UPDATE central_stock
       SET quantity = quantity - v_qty
     WHERE warehouse_id = p_warehouse_id AND item_id = v_item_id;

    -- Add to branch stock (triggers will fire automatically: audit + threshold check)
    UPDATE branch_stock
       SET quantity = quantity + v_qty,
           last_restocked_at = NOW()
     WHERE branch_id = v_branch_id AND item_id = v_item_id;

    -- Mark request fulfilled
    UPDATE restock_requests
       SET status = 'fulfilled',
           fulfilled_at = NOW()
     WHERE request_id = p_request_id;

    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END;
$$;
