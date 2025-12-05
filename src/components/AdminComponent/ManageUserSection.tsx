import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  User,
  Save,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '../ui/dropdown-menu';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '../ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface User {
  id: number;
  name: string;
  email: string;
  phoneNum?: string;
  role: string;
  status: string;
  initials: string;
  ICNo?: string;
}

interface EditUserForm {
  id: number;
  name: string;
  email: string;
  phoneNum: string;
  role: string;
  status: string;
  ICNo: string;
}

export function ManageUserSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<EditUserForm>({
    id: 0,
    name: '',
    email: '',
    phoneNum: '',
    role: '',
    status: '',
    ICNo: ''
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogType, setDialogType] = useState<'success' | 'error'>('success');

  // Fetch users from backend
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:3001/api/manage-users");
      setUsers(response.data);
    } catch (err) {
      console.error("Error loading users:", err);
      showDialog('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Function to show dialog messages
  const showDialog = (message: string, type: 'success' | 'error') => {
    setDialogMessage(message);
    setDialogType(type);
    if (type === 'success') {
      setShowSuccessDialog(true);
    } else {
      setShowErrorDialog(true);
    }
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      id: user.id,
      name: user.name,
      email: user.email,
      phoneNum: user.phoneNum || '',
      role: user.role,
      status: user.status,
      ICNo: user.ICNo || ''
    });
    setShowEditDialog(true);
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const response = await axios.put(
        `http://localhost:3001/api/manage-users/${editForm.id}`,
        editForm
      );

      if (response.data.success) {
        // Update local state
        setUsers(users.map(user => 
          user.id === editForm.id ? { ...user, ...editForm } : user
        ));
        
        // Show success dialog
        showDialog('User updated successfully!', 'success');
        
        // Close edit dialog
        setTimeout(() => {
          setShowEditDialog(false);
        }, 500);
      }
    } catch (err: any) {
      console.error("Error updating user:", err);
      showDialog(err.response?.data?.message || 'Failed to update user', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    
    setDeleting(true);
    try {
      const response = await axios.delete(
        `http://localhost:3001/api/manage-users/${selectedUser.id}`
      );

      if (response.data.success) {
        // Remove from local state
        setUsers(users.filter(user => user.id !== selectedUser.id));
        setShowDeleteDialog(false);
        setSelectedUser(null);
        
        // Show success dialog
        showDialog('User deleted successfully!', 'success');
      }
    } catch (err: any) {
      console.error("Error deleting user:", err);
      showDialog(err.response?.data?.message || 'Failed to delete user', 'error');
      setShowDeleteDialog(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleCloseEditDialog = () => {
    setShowEditDialog(false);
    setEditForm({
      id: 0,
      name: '',
      email: '',
      phoneNum: '',
      role: '',
      status: '',
      ICNo: ''
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl text-gray-900 mb-1">Manage Users</h2>
        <p className="text-sm text-gray-500">View and manage all system users</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Directory</CardTitle>
              <CardDescription>Total {users.length} users in the system</CardDescription>
            </div>
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading users...</p>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user: User) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback className="bg-blue-600 text-white">
                                {user.initials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm text-gray-900">{user.name}</p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <Mail className="size-3" />
                              {user.email}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <Phone className="size-3" />
                              {user.phoneNum || '-'}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {user.role}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={user.status === 'Active' ? 'default' : 'secondary'}
                            className={user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                          >
                            {user.status}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditClick(user)}>
                                <Edit className="size-4 mr-2" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteClick(user)}
                                className="text-red-600"
                              >
                                <Trash2 className="size-4 mr-2" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleEditSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    id="name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="pl-10"
                    required
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    className="pl-10"
                    required
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNum">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    id="phoneNum"
                    value={editForm.phoneNum}
                    onChange={(e) => setEditForm({...editForm, phoneNum: e.target.value})}
                    className="pl-10"
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={editForm.role}
                    onValueChange={(value) => setEditForm({...editForm, role: value})}
                    disabled={saving}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="doctor">Doctor</SelectItem>
                      <SelectItem value="nurse">Nurse</SelectItem>
                      <SelectItem value="receptionist">Receptionist</SelectItem>
                      <SelectItem value="pharmacist">Pharmacist</SelectItem>
                      <SelectItem value="lab-tech">Lab Technician</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={editForm.status}
                    onValueChange={(value) => setEditForm({...editForm, status: value})}
                    disabled={saving}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ICNo">IC Number</Label>
                <Input
                  id="ICNo"
                  value={editForm.ICNo}
                  onChange={(e) => setEditForm({...editForm, ICNo: e.target.value})}
                  placeholder="YYMMDD-PB-####"
                  disabled={saving}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseEditDialog}
                disabled={saving}
              >
                <X className="size-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="size-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold">{selectedUser?.name}</span>? 
              This action cannot be undone and will permanently remove the user from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="size-4 mr-2" />
                  Delete User
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* SUCCESS DIALOG */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center text-center py-6">
            {/* Animated Success Icon */}
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-4 animate-bounce">
              <svg 
                className="w-12 h-12 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="3" 
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            
            {/* Success Message */}
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-green-600">
                Success!
              </DialogTitle>
              <DialogDescription className="text-base mt-2">
                {dialogMessage}
              </DialogDescription>
            </DialogHeader>
            
            {/* Close Button */}
            <Button 
              className="mt-6 bg-green-600 hover:bg-green-700 w-full"
              onClick={() => setShowSuccessDialog(false)}
            >
              <Check className="size-4 mr-2" />
              Great!
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ERROR DIALOG */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center text-center py-6">
            {/* Animated Error Icon */}
            <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-12 h-12 text-white" />
            </div>
            
            {/* Error Message */}
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-red-600">
                Error!
              </DialogTitle>
              <DialogDescription className="text-base mt-2">
                {dialogMessage}
              </DialogDescription>
            </DialogHeader>
            
            {/* Close Button */}
            <Button 
              className="mt-6 bg-red-600 hover:bg-red-700 w-full"
              onClick={() => setShowErrorDialog(false)}
            >
              Okay
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}