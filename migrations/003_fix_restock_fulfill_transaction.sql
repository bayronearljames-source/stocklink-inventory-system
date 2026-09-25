-- migrations/003_fix_restock_fulfill_transaction.sql
-- Fixes: procedure had explicit COMMIT/ROLLBACK while also using an
-- EXCEPTION block, which implicitly creates a sub-transaction in
-- PL/pgSQL. Combining both caused "cannot commit while a subtransaction
-- is active". A CALLed procedure commits/rolls back automatically, so
-- the explicit COMMIT/ROLLBACK were both redundant and invalid.

CREATE OR REPLACE PROCEDURE public.sp_fulfill_restock_request(IN p_request_id integer, IN p_warehouse_id integer)
 LANGUAGE plpgsql
AS $procedure$
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
       SET quantity = quantity + v_qty,
           last_restocked_at = NOW()
     WHERE branch_id = v_branch_id AND item_id = v_item_id;

    UPDATE restock_requests
       SET status = 'fulfilled',
           fulfilled_at = NOW()
     WHERE request_id = p_request_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END;
$procedure$;