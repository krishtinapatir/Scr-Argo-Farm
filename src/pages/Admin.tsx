import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/products';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Title, Tooltip } from 'chart.js';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { AlertTriangle, ChevronDown, ChevronUp, Package, Pencil, Plus, SaveIcon, Trash2, X } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';

// Initialize Chart.js
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend
);

interface Order {
  id: string;
  created_at: string;
  status: string;
  total: number;
  user_id: string;
  updated_at: string;
  order_number?: string;
  payment_method?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  delivery_address?: string;
  delivery_city?: string;
  delivery_state?: string;
  delivery_zip_code?: string;
  payment_id?: string;
  payment_order_id?: string;
  payment_signature?: string;
  admin_visible?: boolean;
  cancelled_at?: string;
  cancellation_reason?: string;
  cancelled_by?: string;
  profiles?: {
    name?: string;
    email?: string;
  };
  order_items?: Array<{
    id: string;
    quantity: number;
    price: number;
    products?: {
      title: string;
      price: string;
      image: string;
    };
  }>;
}

interface Profile {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
}

interface ProductWithStock extends Product {
  stock_quantity: number;
  min_stock_level: number;
  max_stock_level: number;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

const Admin: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductWithStock | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [stockUpdateProduct, setStockUpdateProduct] = useState<ProductWithStock | null>(null);
  const [stockUpdateQuantity, setStockUpdateQuantity] = useState<number>(0);
  const [newProduct, setNewProduct] = useState<Partial<ProductWithStock>>({
    title: '', image: '', price: '', unit: '', description: '', full_description: '', ingredients: '', usage_instructions: '', stock_quantity: 0, min_stock_level: 10, max_stock_level: 100
  });

  // Fetch products with stock information
  const { data: products = [], isLoading: productsLoading, error: productsError } = useQuery<ProductWithStock[]>({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, stock_quantity, min_stock_level, max_stock_level')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(product => ({
        ...product,
        stock_status: product.stock_quantity <= 0 ? 'out_of_stock' :
          product.stock_quantity <= (product.min_stock_level || 10) ? 'low_stock' :
            'in_stock'
      })) as ProductWithStock[];
    },
  });

  // Fetch orders with proper error handling
  const { data: orders = [], isLoading: ordersLoading, error: ordersError } = useQuery<Order[]>({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      const userIds = [...new Set(ordersData.map(order => order.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', userIds);

      const ordersWithProfiles = ordersData.map(order => ({
        ...order,
        profiles: profilesData?.find(profile => profile.id === order.user_id)
      }));

      const ordersWithItems = await Promise.all(
        (ordersWithProfiles || []).map(async (order) => {
          const { data: itemsData, error: itemsError } = await supabase
            .from('order_items')
            .select(`
              *,
              products (
                title, price, image
              )
            `)
            .eq('order_id', order.id);

          return {
            ...order,
            order_items: itemsData || []
          };
        })
      );

      return ordersWithItems as Order[];
    },
    retry: 3,
    retryDelay: 1000,
  });

  // Calculate order statistics
  const orderStats = useMemo(() => {
    if (!orders || orders.length === 0) {
      return {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        statusCounts: {}
      };
    }

    const visibleOrders = orders.filter(order => order.admin_visible !== false);

    return {
      totalOrders: visibleOrders.length,
      totalRevenue: visibleOrders.reduce((sum, order) => sum + (order.total || 0), 0),
      averageOrderValue: visibleOrders.length > 0 ?
        visibleOrders.reduce((sum, order) => sum + (order.total || 0), 0) / visibleOrders.length : 0,
      statusCounts: visibleOrders.reduce((counts, order) => {
        counts[order.status] = (counts[order.status] || 0) + 1;
        return counts;
      }, {} as Record<string, number>)
    };
  }, [orders]);

  // Fetch profiles
  const { data: profiles = [], isLoading: profilesLoading } = useQuery<Profile[]>({
    queryKey: ['admin-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Profile[];
    },
  });

  // Create product mutation with stock
  const createProduct = useMutation({
    mutationFn: async (product: Partial<ProductWithStock>) => {
      const { data, error } = await supabase
        .from('products')
        .insert([{
          ...product,
          stock_quantity: product.stock_quantity || 0,
          min_stock_level: product.min_stock_level || 10,
          max_stock_level: product.max_stock_level || 100
        }])
        .select();

      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Product added",
        description: "The product has been added successfully with stock information."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "There was a problem adding the product.",
        variant: "destructive"
      });
    }
  });

  // Update product mutation
  const updateProduct = useMutation({
    mutationFn: async (product: ProductWithStock) => {
      const updateFields = {
        title: product.title, image: product.image, price: product.price, unit: product.unit,
        description: product.description, full_description: product.full_description, ingredients: product.ingredients, usage_instructions: product.usage_instructions, stock_quantity: product.stock_quantity, min_stock_level: product.min_stock_level, max_stock_level: product.max_stock_level, updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('products')
        .update(updateFields)
        .eq('id', product.id)
        .select();

      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Product updated",
        description: "The product has been updated successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `There was a problem updating the product: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Update stock mutation
  const updateStock = useMutation({
    mutationFn: async ({ productId, newQuantity, operation }: { productId: string, newQuantity: number, operation: 'add' | 'subtract' | 'set' }) => {
      const { data: currentProduct, error: fetchError } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', productId)
        .single();

      if (fetchError) throw fetchError;

      let finalQuantity = newQuantity;
      if (operation === 'add') {
        finalQuantity = currentProduct.stock_quantity + newQuantity;
      } else if (operation === 'subtract') {
        finalQuantity = Math.max(0, currentProduct.stock_quantity - newQuantity);
      }

      const { data, error } = await supabase
        .from('products')
        .update({
          stock_quantity: finalQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)
        .select();

      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Stock updated",
        description: `Stock has been updated successfully.`
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "There was a problem updating the stock.",
        variant: "destructive"
      });
    }
  });

  // Delete product mutation
  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Product deleted",
        description: "The product has been removed successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "There was a problem deleting the product.",
        variant: "destructive"
      });
    }
  });

  // Stock management functions
  const handleStockUpdate = (product: ProductWithStock) => {
    setStockUpdateProduct(product);
    setStockUpdateQuantity(0);
  };

  const handleStockSave = (operation: 'add' | 'subtract' | 'set' | 'add10') => {
    if (!stockUpdateProduct) return;

    let quantity = stockUpdateQuantity;
    let op = operation;
    if (operation === 'add10') {
      quantity = 10;
      op = 'add';
    }

    updateStock.mutate({
      productId: stockUpdateProduct.id,
      newQuantity: quantity,
      operation: op as 'add' | 'subtract' | 'set'
    }, {
      onSuccess: () => {
        setStockUpdateProduct(null);
        setStockUpdateQuantity(0);
      }
    });
  };

  // Get stock status color
  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'out_of_stock': return 'bg-red-100 text-red-800';
      case 'low_stock': return 'bg-yellow-100 text-yellow-800';
      case 'in_stock': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get low stock products
  const lowStockProducts = products.filter(product =>
    product.stock_status === 'low_stock' || product.stock_status === 'out_of_stock'
  );

  // Edit a product
  const handleEdit = (product: ProductWithStock) => {
    const productCopy = {
      ...product,
      full_description: product.full_description || '',
      ingredients: product.ingredients || '',
      usage_instructions: product.usage_instructions || '',
      stock_quantity: product.stock_quantity || 0,
      min_stock_level: product.min_stock_level || 10,
      max_stock_level: product.max_stock_level || 100
    };

    setEditingProduct(productCopy);
    setIsAddingNew(false);
  };

  // Update product in edit mode
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editingProduct) return;

    const { name, value, type } = e.target;
    let processedValue: any = value;

    if (type === 'number') {
      processedValue = value === '' ? 0 : parseFloat(value) || 0;
    }

    setEditingProduct(prev => ({
      ...prev!,
      [name]: processedValue
    }));
  };

  // Save edited product
  const handleSaveEdit = () => {
    if (!editingProduct) return;

    if (!editingProduct.title || !editingProduct.price || !editingProduct.unit) {
      toast({
        title: "Validation Error",
        description: "Title, price, and unit are required fields.",
        variant: "destructive"
      });
      return;
    }

    updateProduct.mutate(editingProduct, {
      onSuccess: () => {
        setEditingProduct(null);
      }
    });
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingProduct(null);
  };

  // Delete a product
  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteProduct.mutate(id);
    }
  };

  // Add new product form handlers
  const handleNewProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
    setNewProduct({
      ...newProduct,
      [e.target.name]: value
    });
  };

  const handleCancelNew = () => {
    setIsAddingNew(false);
    setNewProduct({
      title: '', image: '', price: '', unit: '', description: '', full_description: '',
      ingredients: '', usage_instructions: '', stock_quantity: 0, min_stock_level: 10, max_stock_level: 100
    });
  };

  const handleSaveNew = () => {
    if (!newProduct.title || !newProduct.price || !newProduct.unit) {
      toast({
        title: "Missing information",
        description: "Please fill in at least the title, price, and unit fields.",
        variant: "destructive"
      });
      return;
    }

    const productToAdd = {
      ...newProduct,
      title: newProduct.title ?? '',
      image: newProduct.image ?? 'https://images.unsplash.com/photo-1550583724-b2692b85b150?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
      price: newProduct.price ?? '0',
      unit: newProduct.unit ?? 'unit',
      description: newProduct.description ?? '',
      stock_quantity: newProduct.stock_quantity ?? 0,
      min_stock_level: newProduct.min_stock_level ?? 10,
      max_stock_level: newProduct.max_stock_level ?? 100
    };

    createProduct.mutate(productToAdd, {
      onSuccess: () => {
        setIsAddingNew(false);
        setNewProduct({ title: '', image: '', price: '', unit: '', description: '', full_description: '', ingredients: '', usage_instructions: '', stock_quantity: 0, min_stock_level: 10, max_stock_level: 100 });
      }
    });
  };

  // Toggle order expansion function
  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  // Calculate sales data
  const calculateSalesData = (orders: Order[]) => {
    const salesByMonth: Record<string, number> = {};
    orders.forEach(order => {
      const month = format(new Date(order.created_at), 'MMM yyyy');
      salesByMonth[month] = (salesByMonth[month] || 0) + (order.total || 0);
    });

    const labels = Object.keys(salesByMonth);
    const data = Object.values(salesByMonth);

    return { labels, data };
  };

  // Calculate order statistics
  const calculateOrderStats = (orders: Order[]) => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { totalOrders, totalRevenue, averageOrderValue, statusCounts };
  };

  // Sales analytics component
  const SalesAnalytics = ({ orders }: { orders: Order[] }) => {
    const salesData = calculateSalesData(orders);
    const orderStats = calculateOrderStats(orders);

    const lineChartData = {
      labels: salesData.labels,
      datasets: [
        {
          label: 'Monthly Sales',
          data: salesData.data,
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1,
        },
      ],
    };

    const lineChartOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: true,
          text: 'Monthly Sales Trend',
        },
      },
    };

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Sales Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-600">Total Orders</h4>
              <p className="text-2xl font-bold">{orderStats.totalOrders}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="text-sm font-medium text-green-600">Total Revenue</h4>
              <p className="text-2xl font-bold">₹{orderStats.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="text-sm font-medium text-purple-600">Average Order Value</h4>
              <p className="text-2xl font-bold">₹{orderStats.averageOrderValue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Stock Alerts */}
        {lowStockProducts.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-400">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
              Stock Alerts
            </h3>
            <div className="space-y-2">
              {lowStockProducts.map(product => (
                <div key={product.id} className="flex justify-between items-center p-3 bg-yellow-50 rounded">
                  <div>
                    <span className="font-medium">{product.title}</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStockStatusColor(product.stock_status)}`}>
                      {product.stock_quantity} {product.unit} remaining
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleStockUpdate(product)}
                    variant="outline"
                  >
                    <Package className="w-4 h-4 mr-1" />
                    Restock
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Sales Trend</h3>
          <div className="h-[400px]">
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Order Status Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(orderStats.statusCounts).map(([status, count]) => (
              <div key={status} className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-600">{status}</h4>
                <p className="text-xl font-bold">{count}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl mt-9 font-bold mb-8">Admin Dashboard</h1>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Products & Stock Management</h2>
              {!isAddingNew && (
                <Button onClick={() => {
                  setIsAddingNew(true);
                  setEditingProduct(null);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Product
                </Button>
              )}
            </div>

            {isAddingNew && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 border rounded-lg"
              >
                <h3 className="text-lg font-medium mb-4">Add New Product</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="new-title" className="block text-sm font-medium mb-1">Title</label>
                    <Input
                      id="new-title"
                      name="title"
                      value={newProduct.title ?? ''}
                      onChange={handleNewProductChange}
                      placeholder="Product title"
                    />
                  </div>
                  <div>
                    <label htmlFor="new-image" className="block text-sm font-medium mb-1">Image URL</label>
                    <Input
                      id="new-image"
                      name="image"
                      value={newProduct.image ?? ''}
                      onChange={handleNewProductChange}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <div>
                    <label htmlFor="new-price" className="block text-sm font-medium mb-1">Price</label>
                    <Input
                      id="new-price"
                      name="price"
                      value={newProduct.price ?? ''}
                      onChange={handleNewProductChange}
                      placeholder="100"
                    />
                  </div>
                  <div>
                    <label htmlFor="new-unit" className="block text-sm font-medium mb-1">Unit</label>
                    <Input
                      id="new-unit"
                      name="unit"
                      value={newProduct.unit ?? ''}
                      onChange={handleNewProductChange}
                      placeholder="1 L, 500g, etc."
                    />
                  </div>
                </div>

                {/* Stock Management Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-blue-50 rounded-lg">
                  <div>
                    <label htmlFor="new-stock-quantity" className="block text-sm font-medium mb-1">Initial Stock Quantity</label>
                    <Input
                      id="new-stock-quantity"
                      name="stock_quantity"
                      type="number"
                      min="0"
                      value={newProduct.stock_quantity ?? 0}
                      onChange={handleNewProductChange}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label htmlFor="new-min-stock" className="block text-sm font-medium mb-1">Minimum Stock Level</label>
                    <Input
                      id="new-min-stock"
                      name="min_stock_level"
                      type="number"
                      min="0"
                      value={newProduct.min_stock_level ?? 10}
                      onChange={handleNewProductChange}
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <label htmlFor="new-max-stock" className="block text-sm font-medium mb-1">Maximum Stock Level</label>
                    <Input
                      id="new-max-stock"
                      name="max_stock_level"
                      type="number"
                      min="0"
                      value={newProduct.max_stock_level ?? 100}
                      onChange={handleNewProductChange}
                      placeholder="100"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="new-description" className="block text-sm font-medium mb-1">Short Description</label>
                  <Textarea
                    id="new-description"
                    name="description"
                    value={newProduct.description ?? ''}
                    onChange={handleNewProductChange}
                    placeholder="Brief description for product card"
                    rows={2}
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="new-full-description" className="block text-sm font-medium mb-1">Full Description</label>
                  <Textarea
                    id="new-full-description"
                    name="full_description"
                    value={newProduct.full_description ?? ''}
                    onChange={handleNewProductChange}
                    placeholder="Detailed description for product page"
                    rows={3}
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="new-ingredients" className="block text-sm font-medium mb-1">Ingredients</label>
                  <Textarea
                    id="new-ingredients"
                    name="ingredients"
                    value={newProduct.ingredients ?? ''}
                    onChange={handleNewProductChange}
                    placeholder="List of ingredients"
                    rows={2}
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="new-usage" className="block text-sm font-medium mb-1">Usage Instructions</label>
                  <Textarea
                    id="new-usage"
                    name="usage_instructions"
                    value={newProduct.usage_instructions ?? ''}
                    onChange={handleNewProductChange}
                    placeholder="How to use this product"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveNew}
                    disabled={createProduct.isPending}
                  >
                    <SaveIcon className="w-4 h-4 mr-2" />
                    {createProduct.isPending ? 'Saving...' : 'Save Product'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelNew}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}

            {productsLoading ? (
              <div className="text-center py-8">Loading products...</div>
            ) : productsError ? (
              <div className="text-center py-8 text-red-600">
                Error loading products: {productsError.message}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <img
                          src={product.image}
                          alt={product.title}
                          className="w-12 h-12 object-cover rounded"
                        />
                      </TableCell>
                      <TableCell>
                        {editingProduct?.id === product.id ? (
                          <Input
                            name="title"
                            value={editingProduct.title}
                            onChange={handleEditChange}
                            className="w-full"
                          />
                        ) : (
                          <div>
                            <div className="font-medium">{product.title}</div>
                            <div className="text-sm text-gray-500">{product.description}</div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingProduct?.id === product.id ? (
                          <Input
                            name="price"
                            value={editingProduct.price}
                            onChange={handleEditChange}
                            className="w-20"
                          />
                        ) : (
                          `₹${product.price}`
                        )}
                      </TableCell>
                      <TableCell>
                        {editingProduct?.id === product.id ? (
                          <Input
                            name="unit"
                            value={editingProduct.unit}
                            onChange={handleEditChange}
                            className="w-20"
                          />
                        ) : (
                          product.unit
                        )}
                      </TableCell>
                      <TableCell>
                        {editingProduct?.id === product.id ? (
                          <div className="space-y-2">
                            <Input
                              name="stock_quantity"
                              type="number"
                              min="0"
                              value={editingProduct.stock_quantity}
                              onChange={handleEditChange}
                              className="w-20"
                            />
                            <div className="text-xs text-gray-500">
                              Min: {editingProduct.min_stock_level} | Max: {editingProduct.max_stock_level}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{product.stock_quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStockUpdate(product)}
                            >
                              <Package className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStockStatusColor(product.stock_status)}`}>
                          {product.stock_status === 'in_stock' ? 'In Stock' :
                            product.stock_status === 'low_stock' ? 'Low Stock' : 'Out of Stock'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {editingProduct?.id === product.id ? (
                            <>
                              <Button
                                size="sm"
                                onClick={handleSaveEdit}
                                disabled={updateProduct.isPending}
                              >
                                <SaveIcon className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEdit}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(product)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(product.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-6">Order Management</h2>

            {ordersLoading ? (
              <div className="text-center py-8">Loading orders...</div>
            ) : ordersError ? (
              <div className="text-center py-8 text-red-600">
                Error loading orders: {ordersError.message}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No orders found</div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg p-4"
                  >
                    <div
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() => toggleOrderExpansion(order.id)}
                    >
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-medium">Order #{order.order_number || order.id.slice(0, 8)}</h3>
                          <p className="text-sm text-gray-600">
                            {order.profiles?.name || order.customer_name || 'Unknown Customer'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-medium">₹{order.total?.toFixed(2) || '0.00'}</p>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        {expandedOrderId === order.id ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </div>
                    </div>

                    {expandedOrderId === order.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="mt-4 pt-4 border-t"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <h4 className="font-medium mb-2">Customer Information</h4>
                            <p className="text-sm"><strong>Name:</strong> {order.profiles?.name || order.customer_name || 'N/A'}</p>
                            <p className="text-sm"><strong>Email:</strong> {order.profiles?.email || order.customer_email || 'N/A'}</p>
                            <p className="text-sm"><strong>Phone:</strong> {order.customer_phone || 'N/A'}</p>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Delivery Information</h4>
                            <p className="text-sm"><strong>Address:</strong> {order.delivery_address || 'N/A'}</p>
                            <p className="text-sm"><strong>City:</strong> {order.delivery_city || 'N/A'}</p>
                            <p className="text-sm"><strong>State:</strong> {order.delivery_state || 'N/A'}</p>
                            <p className="text-sm"><strong>ZIP:</strong> {order.delivery_zip_code || 'N/A'}</p>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Order Items</h4>
                          {order.order_items && order.order_items.length > 0 ? (
                            <div className="space-y-2">
                              {order.order_items.map((item) => (
                                <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                  <div className="flex items-center space-x-3">
                                    {item.products?.image && (
                                      <img
                                        src={item.products.image}
                                        alt={item.products.title}
                                        className="w-10 h-10 object-cover rounded"
                                      />
                                    )}
                                    <div>
                                      <p className="font-medium">{item.products?.title || 'Unknown Product'}</p>
                                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium">₹{item.price?.toFixed(2) || '0.00'}</p>
                                    <p className="text-sm text-gray-500">
                                      Total: ₹{((item.price || 0) * item.quantity).toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">No items found for this order</p>
                          )}
                        </div>

                        <div className="mt-4 pt-4 border-t">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm"><strong>Payment Method:</strong> {order.payment_method || 'N/A'}</p>
                              {order.cancelled_at && (
                                <p className="text-sm text-red-600">
                                  <strong>Cancelled:</strong> {format(new Date(order.cancelled_at), 'MMM dd, yyyy HH:mm')}
                                  {order.cancellation_reason && (
                                    <span className="block">Reason: {order.cancellation_reason}</span>
                                  )}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold">Total: ₹{order.total?.toFixed(2) || '0.00'}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="users">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-6">User Management</h2>

            {profilesLoading ? (
              <div className="text-center py-8">Loading users...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell>{profile.name || 'N/A'}</TableCell>
                      <TableCell>{profile.email}</TableCell>
                      <TableCell>{profile.phone || 'N/A'}</TableCell>
                      <TableCell>
                        {profile.address ?
                          `${profile.address}, ${profile.city || ''}, ${profile.state || ''}`.trim() :
                          'N/A'
                        }
                      </TableCell>
                      <TableCell>{format(new Date(profile.created_at), 'MMM dd, yyyy')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <SalesAnalytics orders={orders} />
        </TabsContent>
      </Tabs>

      {/* Stock Update Modal */}
      {stockUpdateProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Update Stock for {stockUpdateProduct.title}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Current Stock: {stockUpdateProduct.stock_quantity} {stockUpdateProduct.unit}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Quantity</label>
                <Input
                  type="number"
                  min="0"
                  value={stockUpdateQuantity}
                  onChange={(e) => setStockUpdateQuantity(parseInt(e.target.value) || 0)}
                  placeholder="Enter quantity"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => handleStockSave('add')}
                  disabled={updateStock.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Add Stock
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleStockSave('subtract')}
                  disabled={updateStock.isPending}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Remove Stock
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleStockSave('set')}
                  disabled={updateStock.isPending}
                  variant="outline"
                >
                  Set Exact
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleStockSave('add10')}
                  disabled={updateStock.isPending}
                  variant="outline"
                >
                  Quick +10
                </Button>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStockUpdateProduct(null);
                    setStockUpdateQuantity(0);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
