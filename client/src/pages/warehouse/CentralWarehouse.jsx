import { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import LoadingOverlay from "../../components/common/LoadingOverlay";
import { useToast } from "../../components/common/ToastContainer";
import { apiClient } from "../../api/client";
import { Boxes, Pencil, Plus } from "lucide-react";

export const CentralWarehouse = () => {
  const toast = useToast();
  const [warehouses, setWarehouses] = useState([]);
  const [items, setItems] = useState([]);
  const [stockRows, setStockRows] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [warehouseData, itemData] = await Promise.all([
        apiClient.get("/warehouses"),
        apiClient.get("/items"),
      ]);
      setWarehouses(warehouseData);
      setItems(itemData);
      const warehouseId = selectedWarehouse || String(warehouseData[0]?.warehouse_id ?? "");
      if (!selectedWarehouse && warehouseId) setSelectedWarehouse(warehouseId);
      const stockData = await apiClient.get(
        warehouseId ? `/central-stock?warehouse_id=${warehouseId}` : "/central-stock",
      );
      setStockRows(stockData);
    } catch (err) {
      setError(err.message);
      toast.error(`Failed to load data: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [selectedWarehouse, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refreshStock = async (warehouseId = selectedWarehouse) => {
    if (!warehouseId) {
      setStockRows([]);
      return;
    }
    const data = await apiClient.get(`/central-stock?warehouse_id=${warehouseId}`);
    setStockRows(data);
  };

  const stockedItemIds = useMemo(
    () => new Set(stockRows.map((row) => row.item_id)),
    [stockRows],
  );
  const availableItems = editingStock
    ? items
    : items.filter((item) => !stockedItemIds.has(item.item_id));

  const openAdd = () => {
    setEditingStock(null);
    setItemId("");
    setQuantity("");
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEdit = (row) => {
    setEditingStock(row);
    setItemId(String(row.item_id));
    setQuantity(String(row.quantity));
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (!isSaving) setIsModalOpen(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const qty = Number(quantity);
    if (!editingStock && !itemId) {
      setFormError("Select an item.");
      return;
    }
    if (quantity.trim() === "" || !Number.isInteger(qty) || qty < 0) {
      setFormError("Quantity must be a whole number of 0 or greater.");
      return;
    }
    setIsSaving(true);
    setFormError(null);
    try {
      if (editingStock) {
        await apiClient.put(
          `/central-stock/${editingStock.warehouse_id}/${editingStock.item_id}`,
          { quantity: qty },
        );
        const itemName = editingStock.items?.item_name || `Item #${editingStock.item_id}`;
        toast.success(`Central stock updated: ${itemName} (Qty: ${qty})`);
      } else {
        await apiClient.post("/central-stock", {
          warehouse_id: Number(selectedWarehouse),
          item_id: Number(itemId),
          quantity: qty,
        });
        const itemName = items.find(i => i.item_id === Number(itemId))?.item_name || 'item';
        toast.success(`Central stock added: ${itemName} (Qty: ${qty})`);
      }
      await refreshStock();
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err.message);
      toast.error(`Failed to save stock: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleWarehouseChange = async (event) => {
    const warehouseId = event.target.value;
    setSelectedWarehouse(warehouseId);
    setIsLoading(true);
    setError(null);
    try {
      setStockRows(warehouseId
        ? await apiClient.get(`/central-stock?warehouse_id=${warehouseId}`)
        : []);
    } catch (err) {
      setError(err.message);
      toast.error(`Failed to load warehouse stock: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedWarehouseData = warehouses.find(
    (warehouse) => String(warehouse.warehouse_id) === selectedWarehouse,
  );

  return (
    <div>
      <PageHeader
        title="Central Warehouse"
        description="Review central inventory by warehouse and maintain item quantities used to fulfill branch restock requests."
        badge={<span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">Admin Only</span>}
        action={
          <Button variant="primary" icon={Plus} onClick={openAdd} disabled={!selectedWarehouse || isLoading || availableItems.length === 0}>
            Add Stock Record
          </Button>
        }
      />

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5 pb-4 border-b border-slate-100">
          <label htmlFor="warehouse-filter" className="text-xs font-bold text-slate-700 uppercase">Warehouse</label>
          <select
            id="warehouse-filter"
            value={selectedWarehouse}
            onChange={handleWarehouseChange}
            disabled={!warehouses.length}
            className="max-w-md px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {!warehouses.length && <option value="">No warehouses available</option>}
            {warehouses.map((warehouse) => (
              <option key={warehouse.warehouse_id} value={String(warehouse.warehouse_id)}>
                {warehouse.warehouse_name} — {warehouse.location}
              </option>
            ))}
          </select>
          {selectedWarehouseData && (
            <span className="text-xs text-slate-500">{stockRows.length} stocked item{stockRows.length === 1 ? "" : "s"}</span>
          )}
        </div>

        {isLoading && <LoadingOverlay message="Loading central inventory…" />}
        {!isLoading && error && <div className="py-8 text-center text-sm text-rose-600">Failed to load central inventory: {error}</div>}
        {!isLoading && !error && warehouses.length === 0 && (
          <div className="py-10 text-center text-sm text-slate-500">No central warehouses are configured.</div>
        )}
        {!isLoading && !error && warehouses.length > 0 && stockRows.length === 0 && (
          <div className="py-10 text-center text-sm text-slate-500">No central stock records for this warehouse. Add an item to begin tracking stock.</div>
        )}
        {!isLoading && !error && stockRows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50/50">
                  <th className="py-3 px-3">Item</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Unit</th>
                  <th className="py-3 px-3 text-right">Quantity</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {stockRows.map((row) => (
                  <tr key={`${row.warehouse_id}-${row.item_id}`}>
                    <td className="py-3 px-3 font-medium text-slate-900">{row.items?.item_name ?? `Item #${row.item_id}`}</td>
                    <td className="py-3 px-3">{row.items?.category ?? "—"}</td>
                    <td className="py-3 px-3">{row.items?.unit_of_measure ?? "pcs"}</td>
                    <td className="py-3 px-3 text-right font-bold">{row.quantity}</td>
                    <td className="py-3 px-3 text-right">
                      <Button variant="secondary" size="sm" icon={Pencil} onClick={() => openEdit(row)}>
                        Update
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingStock ? "Update Central Stock" : "Add Central Stock"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <div className="px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">{formError}</div>}
          {!editingStock && (
            <div>
              <label htmlFor="central-stock-item" className="block text-xs font-semibold text-slate-700 mb-1">Item <span className="text-rose-500">*</span></label>
              <select id="central-stock-item" value={itemId} onChange={(event) => setItemId(event.target.value)} required className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="">Select an item</option>
                {availableItems.map((item) => <option key={item.item_id} value={String(item.item_id)}>{item.item_name} — {item.category}</option>)}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="central-stock-quantity" className="block text-xs font-semibold text-slate-700 mb-1">Quantity <span className="text-rose-500">*</span></label>
            <input id="central-stock-quantity" type="number" min="0" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} required className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <p className="flex items-center gap-2 text-xs text-slate-500"><Boxes className="w-4 h-4" />This quantity is held at {selectedWarehouseData?.warehouse_name ?? "the selected warehouse"}.</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal} disabled={isSaving}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={isSaving}>{isSaving ? "Saving…" : editingStock ? "Save Quantity" : "Add Stock"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CentralWarehouse;
