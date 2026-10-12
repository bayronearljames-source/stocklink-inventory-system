-- Record central stock changes and preserve the warehouse source for fulfillment.
-- Safe as an additive migration on an existing StockLink schema.

ALTER TABLE public.stock_movements
    ADD COLUMN IF NOT EXISTS warehouse_id INTEGER
    REFERENCES public.central_warehouse(warehouse_id) ON DELETE RESTRICT;

-- Existing audit_logs.record_id is an integer, while central_stock has a
-- composite key. Store item_id there and retain warehouse_id in the snapshots
-- so each audited central_stock record is unambiguous.
CREATE OR REPLACE FUNCTION public.fn_audit_central_stock()
RETURNS TRIGGER AS $$
DECLARE
    v_changed_by INTEGER;
BEGIN
    v_changed_by := NULLIF(current_setting('app.user_id', true), '')::INTEGER;

    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_logs
            (table_name, record_id, action, old_value, new_value, changed_by, changed_at)
        VALUES
            ('central_stock', NEW.item_id, TG_OP, NULL, to_jsonb(NEW), v_changed_by, NOW());
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_logs
            (table_name, record_id, action, old_value, new_value, changed_by, changed_at)
        VALUES
            ('central_stock', OLD.item_id, TG_OP, to_jsonb(OLD), NULL, v_changed_by, NOW());
        RETURN OLD;
    END IF;

    INSERT INTO public.audit_logs
        (table_name, record_id, action, old_value, new_value, changed_by, changed_at)
    VALUES
        ('central_stock', NEW.item_id, TG_OP, to_jsonb(OLD), to_jsonb(NEW), v_changed_by, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_central_stock ON public.central_stock;
CREATE TRIGGER trg_audit_central_stock
AFTER INSERT OR UPDATE OR DELETE ON public.central_stock
FOR EACH ROW
EXECUTE FUNCTION public.fn_audit_central_stock();

-- Keep actor attribution for branch stock changes made during fulfillment.
CREATE OR REPLACE FUNCTION public.fn_audit_branch_stock()
RETURNS TRIGGER AS $$
DECLARE
    v_changed_by INTEGER;
BEGIN
    v_changed_by := NULLIF(current_setting('app.user_id', true), '')::INTEGER;

    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_logs
            (table_name, record_id, action, old_value, new_value, changed_by, changed_at)
        VALUES
            ('branch_stock', NEW.item_id, TG_OP, NULL, to_jsonb(NEW), v_changed_by, NOW());
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_logs
            (table_name, record_id, action, old_value, new_value, changed_by, changed_at)
        VALUES
            ('branch_stock', OLD.item_id, TG_OP, to_jsonb(OLD), NULL, v_changed_by, NOW());
        RETURN OLD;
    END IF;

    INSERT INTO public.audit_logs
        (table_name, record_id, action, old_value, new_value, changed_by, changed_at)
    VALUES
        ('branch_stock', NEW.item_id, TG_OP, to_jsonb(OLD), to_jsonb(NEW), v_changed_by, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_branch_stock ON public.branch_stock;
CREATE TRIGGER trg_audit_branch_stock
AFTER INSERT OR UPDATE OR DELETE ON public.branch_stock
FOR EACH ROW
EXECUTE FUNCTION public.fn_audit_branch_stock();

CREATE OR REPLACE PROCEDURE public.sp_fulfill_restock_request(
    p_request_id   INTEGER,
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
      FROM public.restock_requests
     WHERE request_id = p_request_id
       AND status = 'pending'
     FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request % not found or already processed', p_request_id;
    END IF;

    SELECT quantity INTO v_available
      FROM public.central_stock
     WHERE warehouse_id = p_warehouse_id AND item_id = v_item_id
     FOR UPDATE;

    IF v_available IS NULL OR v_available < v_qty THEN
        RAISE EXCEPTION 'Insufficient central stock for item %', v_item_id;
    END IF;

    -- Triggers use this transaction-local value to attribute both stock audits.
    PERFORM set_config('app.user_id', p_approved_by::TEXT, true);

    UPDATE public.central_stock
       SET quantity = quantity - v_qty
     WHERE warehouse_id = p_warehouse_id AND item_id = v_item_id;

    -- A request may exist before branch_stock has been initialized. Upsert so
    -- central stock cannot be consumed without crediting the destination branch.
    INSERT INTO public.branch_stock AS current_stock
        (branch_id, item_id, quantity, last_restocked_at)
    VALUES
        (v_branch_id, v_item_id, v_qty, NOW())
    ON CONFLICT (branch_id, item_id) DO UPDATE
       SET quantity = current_stock.quantity + EXCLUDED.quantity,
           last_restocked_at = NOW();

    INSERT INTO public.stock_movements
        (branch_id, item_id, warehouse_id, moved_by, movement_type, quantity, moved_at)
    VALUES
        (v_branch_id, v_item_id, p_warehouse_id, p_approved_by, 'adjustment', v_qty, NOW());

    UPDATE public.restock_requests
       SET status = 'fulfilled',
           fulfilled_at = NOW(),
           approved_by = p_approved_by
     WHERE request_id = p_request_id;
END;
$$;
