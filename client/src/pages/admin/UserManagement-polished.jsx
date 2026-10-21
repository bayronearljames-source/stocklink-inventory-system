import { useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import LoadingOverlay from "../../components/common/LoadingOverlay";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { useToast } from "../../components/common/ToastContainer";
import { apiClient } from "../../api/client";
import { Plus, Pencil, Trash2, Key, UserCheck, AlertCircle } from "lucide-react";

export const UserManagement = () => {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [passwordResetUser, setPasswordResetUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  // Delete confirmation dialog state
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, user: null });

  // Form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [branchId, setBranchId] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [userData, branchData] = await Promise.all([
        apiClient.get("/users"),
        apiClient.get("/branches"),
      ]);
      setUsers(userData);
      setBranches(branchData);
    } catch (err) {
      setError(err.message);
      toast.error(`Failed to load user data: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingUser(null);
    setUsername("");
    setPassword("");
    setRole("");
    setBranchId("");
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setUsername(user.username);
    setPassword("");
    setRole(user.role);
    setBranchId(user.branch_id ? String(user.branch_id) : "");
    setFormError(null);
    setIsModalOpen(true);
  };

  const openPasswordModal = (user) => {
    setPasswordResetUser(user);
    setPassword("");
    setFormError(null);
    setIsPasswordModalOpen(true);
  };

  const closeModal = () => {
    if (!isSaving) {
      setIsModalOpen(false);
      setIsPasswordModalOpen(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);

    // Validation
    if (!editingUser) {
      if (!username || username.length < 3) {
        setFormError("Username must be at least 3 characters");
        return;
      }
      if (!password || password.length < 6) {
        setFormError("Password must be at least 6 characters");
        return;
      }
    }

    if (!role) {
      setFormError("Please select a role");
      return;
    }

    if ((role === "branch_manager" || role === "clerk") && !branchId) {
      setFormError("Branch managers and clerks must be assigned to a branch");
      return;
    }

    setIsSaving(true);

    try {
      if (editingUser) {
        // Update user
        await apiClient.put(`/users/${editingUser.user_id}`, {
          role,
          branch_id: branchId ? Number(branchId) : null,
        });
        toast.success(`User "${username}" updated successfully`);
      } else {
        // Create user
        await apiClient.post("/users", {
          username,
          password,
          role,
          branch_id: branchId ? Number(branchId) : null,
        });
        toast.success(`User "${username}" created successfully`);
      }

      await loadData();
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err.message);
      toast.error(`Failed to save user: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordReset = async (event) => {
    event.preventDefault();
    setFormError(null);

    if (!password || password.length < 6) {
      setFormError("Password must be at least 6 characters");
      return;
    }

    setIsSaving(true);

    try {
      await apiClient.put(`/users/${passwordResetUser.user_id}/password`, {
        password,
      });

      setIsPasswordModalOpen(false);
      toast.success(`Password reset successfully for ${passwordResetUser.username}`);
    } catch (err) {
      setFormError(err.message);
      toast.error(`Failed to reset password: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const openDeleteDialog = (user) => {
    setDeleteDialog({ isOpen: true, user });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({ isOpen: false, user: null });
  };

  const handleDeleteConfirm = async () => {
    const { user } = deleteDialog;
    if (!user) return;

    try {
      await apiClient.delete(`/users/${user.user_id}`);
      toast.success(`User "${user.username}" deleted successfully`);
      await loadData();
      closeDeleteDialog();
    } catch (err) {
      toast.error(`Failed to delete user: ${err.message}`);
      closeDeleteDialog();
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: "bg-purple-100 text-purple-800",
      branch_manager: "bg-blue-100 text-blue-800",
      clerk: "bg-green-100 text-green-800",
    };
    const labels = {
      admin: "Admin",
      branch_manager: "Branch Manager",
      clerk: "Clerk",
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${badges[role] || "bg-gray-100 text-gray-800"}`}>
        {labels[role] || role}
      </span>
    );
  };

  return (
    <div>
      <PageHeader
        title="User Management"
        description="Create, edit, and manage user accounts for the StockLink inventory system."
        badge={<span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">Admin Only</span>}
        action={
          <Button variant="primary" icon={Plus} onClick={openAddModal} disabled={isLoading}>
            Add User
          </Button>
        }
      />

      <Card>
        {isLoading && <LoadingOverlay message="Loading users…" />}

        {!isLoading && error && (
          <div className="py-8 px-4 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold mb-1">Failed to load users</div>
              <div>{error}</div>
            </div>
          </div>
        )}

        {!isLoading && !error && users.length === 0 && (
          <div className="py-10 text-center text-sm text-slate-500">
            No users found. Add a user to get started.
          </div>
        )}

        {!isLoading && !error && users.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50/50">
                  <th className="py-3 px-3">Username</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Branch</th>
                  <th className="py-3 px-3">Created</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {users.map((user) => (
                  <tr key={user.user_id}>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-slate-900">{user.username}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">{getRoleBadge(user.role)}</td>
                    <td className="py-3 px-3">
                      {user.branches ? (
                        <div>
                          <div className="font-medium text-slate-900">{user.branches.branch_name}</div>
                          <div className="text-xs text-slate-500">{user.branches.location}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-500">
                      {new Date(user.created_at).toLocaleDateString("en-PH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={Pencil}
                          onClick={() => openEditModal(user)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={Key}
                          onClick={() => openPasswordModal(user)}
                        >
                          Reset Password
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          icon={Trash2}
                          onClick={() => openDeleteDialog(user)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add/Edit User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingUser ? "Edit User" : "Add New User"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {formError}
            </div>
          )}

          {!editingUser && (
            <>
              <div>
                <label htmlFor="username" className="block text-xs font-semibold text-slate-700 mb-1">
                  Username <span className="text-rose-500">*</span>
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={3}
                  maxLength={50}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter username"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-slate-700 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Minimum 6 characters"
                />
              </div>
            </>
          )}

          <div>
            <label htmlFor="role" className="block text-xs font-semibold text-slate-700 mb-1">
              Role <span className="text-rose-500">*</span>
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select a role</option>
              <option value="admin">Admin</option>
              <option value="branch_manager">Branch Manager</option>
              <option value="clerk">Clerk</option>
            </select>
          </div>

          {(role === "branch_manager" || role === "clerk") && (
            <div>
              <label htmlFor="branch" className="block text-xs font-semibold text-slate-700 mb-1">
                Branch <span className="text-rose-500">*</span>
              </label>
              <select
                id="branch"
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select a branch</option>
                {branches.map((branch) => (
                  <option key={branch.branch_id} value={String(branch.branch_id)}>
                    {branch.branch_name} — {branch.location}
                  </option>
                ))}
              </select>
            </div>
          )}

          {role === "admin" && (
            <div className="px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-700">
              Admins have full system access and are not assigned to a specific branch.
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? "Saving…" : editingUser ? "Save Changes" : "Create User"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Password Reset Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={closeModal}
        title={`Reset Password: ${passwordResetUser?.username}`}
      >
        <form onSubmit={handlePasswordReset} className="space-y-4">
          {formError && (
            <div className="px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {formError}
            </div>
          )}

          <div>
            <label htmlFor="new-password" className="block text-xs font-semibold text-slate-700 mb-1">
              New Password <span className="text-rose-500">*</span>
            </label>
            <input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Minimum 6 characters"
            />
          </div>

          <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
            The user will need to use this new password on their next login.
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? "Resetting…" : "Reset Password"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="Delete User?"
        message={`Are you sure you want to delete user "${deleteDialog.user?.username}"? This action cannot be undone.`}
        confirmText="Delete User"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default UserManagement;
