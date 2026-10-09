-- migrations/006_fix_sp_movement_type.sql
-- Fix: live sp_fulfill_restock_request was inserting movement_type='restock_in'
-- which violates the CHECK constraint on stock_movements.
-- Correct value is 'adjustment' (per the constraint: sale | withdrawal | adjustment).

CREATE OR REPLACE PROCEDURE public.sp_fulfill_restock_request(
    p_request_id  INTEGER,
    p_warehouse_id INTEGER,
    p_approved_by  INTEGER
)
LANGUAGE plpgsql AS $$
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
     FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request % not found or already processed', p_request_id;
    END IF;

    SELECT quantity INTO v_available
      FROM central_stock
     WHERE warehouse_id = p_warehouse_id AND item_id = v_item_id
     FOR UPDATE;

    IF v_available IS NULL OR v_available < v_qty THEN
        RAISE EXCEPTION 'Insufficient central stock for item %', v_item_id;
    END IF;

    UPDATE central_stock
       SET quantity = quantity - v_qty
     WHERE warehouse_id = p_warehouse_id AND item_id = v_item_id;

    UPDATE branch_stock
       SET quantity    = quantity + v_qty,
           last_restocked_at = NOW()
     WHERE branch_id = v_branch_id AND item_id = v_item_id;

    -- Use 'adjustment' — the only allowed inbound movement type per the CHECK constraint
    INSERT INTO stock_movements (branch_id, item_id, moved_by, movement_type, quantity, moved_at)
    VALUES (v_branch_id, v_item_id, p_approved_by, 'adjustment', v_qty, NOW());

    UPDATE restock_requests
       SET status       = 'fulfilled',
           fulfilled_at = NOW(),
           approved_by  = p_approved_by
     WHERE request_id = p_request_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END;
$$;
