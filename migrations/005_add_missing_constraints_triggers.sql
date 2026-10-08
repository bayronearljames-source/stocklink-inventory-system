-- Add missing CHECK constraints to test database
-- Tables already exist, we're just adding constraints and triggers

-- Add CHECK constraint on items.unit_price (must be >= 0)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'items_unit_price_check'
        AND conrelid = 'items'::regclass
    ) THEN
        ALTER TABLE items ADD CONSTRAINT items_unit_price_check CHECK (unit_price >= 0);
    END IF;
END $$;

-- =====================================================================
-- Signature Trigger 1: Auto-generate restock request on low stock
-- =====================================================================

CREATE OR REPLACE FUNCTION fn_check_restock_threshold()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.quantity < NEW.reorder_threshold THEN
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

DROP TRIGGER IF EXISTS trg_branch_stock_low ON branch_stock;
CREATE TRIGGER trg_branch_stock_low
AFTER UPDATE OF quantity ON branch_stock
FOR EACH ROW
EXECUTE FUNCTION fn_check_restock_threshold();

-- =====================================================================
-- Signature Trigger 2: Automated audit logging
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

DROP TRIGGER IF EXISTS trg_audit_branch_stock ON branch_stock;
CREATE TRIGGER trg_audit_branch_stock
AFTER UPDATE ON branch_stock
FOR EACH ROW
EXECUTE FUNCTION fn_audit_branch_stock();
