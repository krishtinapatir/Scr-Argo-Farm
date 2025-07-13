// // import { Button } from '@/components/ui/button';
// // import { Input } from '@/components/ui/input';

// // import {
// //   Table,
// //   TableBody,
// //   TableCell,
// //   TableHead,
// //   TableHeader,
// //   TableRow
// // } from '@/components/ui/table';
// // import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// // import { Textarea } from '@/components/ui/textarea';
// // import { useToast } from '@/hooks/use-toast';
// // import { supabase } from '@/integrations/supabase/client';
// // import { Product } from '@/types/products';
// // import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
// // import { CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Title, Tooltip } from 'chart.js';
// // import { format } from 'date-fns';
// // import { motion } from 'framer-motion';
// // import { AlertTriangle, Package, Pencil, Plus, SaveIcon, Trash2, Users, X } from 'lucide-react';
// // import React, { useState } from 'react';
// // import { Line } from 'react-chartjs-2';

// // // Initialize Chart.js
// // ChartJS.register(
// //   CategoryScale,
// //   LinearScale,
// //   PointElement,
// //   LineElement,
// //   Title,
// //   Tooltip,
// //   Legend
// // );

// // interface Order {
// //   id: string;
// //   created_at: string;
// //   status: string;
// //   total: number;
// //   user_id: string;
// //   updated_at: string;
// //   name?: string;
// //   email?: string;
// //   phone?: string;
// //   address?: string;
// //   city?: string;
// //   state?: string;
// //   zip_code?: string;
// // }

// // interface Profile {
// //   id: string;
// //   email: string;
// //   created_at: string;
// //   updated_at: string;
// // }

// // // Enhanced Product interface with stock management
// // interface ProductWithStock extends Product {
// //   stock_quantity: number;
// //   min_stock_level: number;
// //   max_stock_level: number;
// //   stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
// // }

// // const Admin = () => {
// //   const { toast } = useToast();
// //   const queryClient = useQueryClient();
// //   const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
// //   const [editingProduct, setEditingProduct] = useState<ProductWithStock | null>(null);
// //   const [isAddingNew, setIsAddingNew] = useState(false);
// //   const [stockUpdateProduct, setStockUpdateProduct] = useState<ProductWithStock | null>(null);
// //   const [stockUpdateQuantity, setStockUpdateQuantity] = useState<number>(0);
// //   const [newProduct, setNewProduct] = useState<Partial<ProductWithStock>>({
// //     title: '',
// //     image: '',
// //     price: '',
// //     unit: '',
// //     description: '',
// //     full_description: '',
// //     ingredients: '',
// //     usage_instructions: '',
// //     stock_quantity: 0,
// //     min_stock_level: 10,
// //     max_stock_level: 100
// //   });

// //   // Fetch products with stock information
// //   const { data: products = [], isLoading: productsLoading, error: productsError } = useQuery<ProductWithStock[]>({
// //     queryKey: ['admin-products'],
// //     queryFn: async () => {
// //       const { data, error } = await supabase
// //         .from('products')
// //         .select('*, stock_quantity, min_stock_level, max_stock_level')
// //         .order('created_at', { ascending: false });
        
// //       if (error) throw error;
      
// //       // Calculate stock status for each product
// //       return data.map(product => ({
// //         ...product,
// //         stock_status: product.stock_quantity <= 0 ? 'out_of_stock' : 
// //                     product.stock_quantity <= (product.min_stock_level || 10) ? 'low_stock' : 
// //                     'in_stock'
// //       })) as ProductWithStock[];
// //     },
// //   });

// //   // Fetch orders
// //   const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
// //     queryKey: ['admin-orders'],
// //     queryFn: async () => {
// //       const { data, error } = await supabase
// //         .from('orders')
// //         .select('*')
// //         .order('created_at', { ascending: false });
        
// //       if (error) throw error;
// //       return data as Order[];
// //     },
// //   });

// //   // Fetch profiles
// //   const { data: profiles = [], isLoading: profilesLoading } = useQuery<Profile[]>({
// //     queryKey: ['admin-profiles'],
// //     queryFn: async () => {
// //       const { data, error } = await supabase
// //         .from('profiles')
// //         .select('*')
// //         .order('created_at', { ascending: false });
        
// //       if (error) throw error;
// //       return data as Profile[];
// //     },
// //   });

// //   // Create product mutation with stock
// //   const createProduct = useMutation({
// //     mutationFn: async (product: Partial<ProductWithStock>) => {
// //       const { data, error } = await supabase
// //         .from('products')
// //         .insert([{
// //           ...product,
// //           stock_quantity: product.stock_quantity || 0,
// //           min_stock_level: product.min_stock_level || 10,
// //           max_stock_level: product.max_stock_level || 100
// //         }])
// //         .select();
        
// //       if (error) throw error;
// //       return data[0];
// //     },
// //     onSuccess: () => {
// //       queryClient.invalidateQueries({ queryKey: ['admin-products'] });
// //       queryClient.invalidateQueries({ queryKey: ['products'] });
// //       toast({
// //         title: "Product added",
// //         description: "The product has been added successfully with stock information."
// //       });
// //     },
// //     onError: (error) => {
// //       console.error("Error adding product:", error);
// //       toast({
// //         title: "Error",
// //         description: "There was a problem adding the product.",
// //         variant: "destructive"
// //       });
// //     }
// //   });

// //   // Update product mutation - FIXED VERSION
// //   const updateProduct = useMutation({
// //     mutationFn: async (product: ProductWithStock) => {
// //       // Create a clean update object without the id and computed fields
// //       const updateFields = {
// //         title: product.title,
// //         image: product.image,
// //         price: product.price,
// //         unit: product.unit,
// //         description: product.description,
// //         full_description: product.full_description,
// //         ingredients: product.ingredients,
// //         usage_instructions: product.usage_instructions,
// //         stock_quantity: product.stock_quantity,
// //         min_stock_level: product.min_stock_level,
// //         max_stock_level: product.max_stock_level,
// //         updated_at: new Date().toISOString()
// //       };

// //       console.log('Updating product with ID:', product.id);
// //       console.log('Update fields:', updateFields);

// //       const { data, error } = await supabase
// //         .from('products')
// //         .update(updateFields)
// //         .eq('id', product.id)
// //         .select();
      
// //       if (error) {
// //         console.error('Supabase update error:', error);
// //         throw error;
// //       }
      
// //       console.log('Update successful:', data);
// //       return data[0];
// //     },
// //     onSuccess: () => {
// //       queryClient.invalidateQueries({ queryKey: ['admin-products'] });
// //       queryClient.invalidateQueries({ queryKey: ['products'] });
// //       queryClient.invalidateQueries({ queryKey: ['product'] });
// //       toast({
// //         title: "Product updated",
// //         description: "The product has been updated successfully."
// //       });
// //     },
// //     onError: (error) => {
// //       console.error("Error updating product:", error);
// //       toast({
// //         title: "Error",
// //         description: `There was a problem updating the product: ${error.message}`,
// //         variant: "destructive"
// //       });
// //     }
// //   });

// //   // Update stock mutation
// //   const updateStock = useMutation({
// //     mutationFn: async ({ productId, newQuantity, operation }: { productId: string, newQuantity: number, operation: 'add' | 'subtract' | 'set' }) => {
// //       const { data: currentProduct, error: fetchError } = await supabase
// //         .from('products')
// //         .select('stock_quantity')
// //         .eq('id', productId)
// //         .single();

// //       if (fetchError) throw fetchError;

// //       let finalQuantity = newQuantity;
// //       if (operation === 'add') {
// //         finalQuantity = currentProduct.stock_quantity + newQuantity;
// //       } else if (operation === 'subtract') {
// //         finalQuantity = Math.max(0, currentProduct.stock_quantity - newQuantity);
// //       }

// //       const { data, error } = await supabase
// //         .from('products')
// //         .update({ 
// //           stock_quantity: finalQuantity,
// //           updated_at: new Date().toISOString()
// //         })
// //         .eq('id', productId)
// //         .select();
        
// //       if (error) throw error;
// //       return data[0];
// //     },
// //     onSuccess: (data, variables) => {
// //       queryClient.invalidateQueries({ queryKey: ['admin-products'] });
// //       queryClient.invalidateQueries({ queryKey: ['products'] });
// //       toast({
// //         title: "Stock updated",
// //         description: `Stock has been updated successfully.`
// //       });
// //     },
// //     onError: (error) => {
// //       console.error("Error updating stock:", error);
// //       toast({
// //         title: "Error",
// //         description: "There was a problem updating the stock.",
// //         variant: "destructive"
// //       });
// //     }
// //   });

// //   // Delete product mutation
// //   const deleteProduct = useMutation({
// //     mutationFn: async (id: string) => {
// //       const { error } = await supabase
// //         .from('products')
// //         .delete()
// //         .eq('id', id);
        
// //       if (error) throw error;
// //       return id;
// //     },
// //     onSuccess: () => {
// //       queryClient.invalidateQueries({ queryKey: ['admin-products'] });
// //       queryClient.invalidateQueries({ queryKey: ['products'] });
// //       toast({
// //         title: "Product deleted",
// //         description: "The product has been removed successfully."
// //       });
// //     },
// //     onError: (error) => {
// //       console.error("Error deleting product:", error);
// //       toast({
// //         title: "Error",
// //         description: "There was a problem deleting the product.",
// //         variant: "destructive"
// //       });
// //     }
// //   });

// //   // Stock management functions
// //   const handleStockUpdate = (product: ProductWithStock) => {
// //     setStockUpdateProduct(product);
// //     setStockUpdateQuantity(0);
// //   };

// // const handleStockSave = (operation: 'add' | 'subtract' | 'set' | 'add10') => {
// //   if (!stockUpdateProduct) return;

// //   let quantity = stockUpdateQuantity;
// //   if (operation === 'add10') {
// //     quantity = 10;
// //     operation = 'add';
// //   }

// //   updateStock.mutate({
// //     productId: stockUpdateProduct.id,
// //     newQuantity: quantity,
// //     operation
// //   }, {
// //     onSuccess: () => {
// //       setStockUpdateProduct(null);
// //       setStockUpdateQuantity(0);
// //     }
// //   });
// // };

// //   // Get stock status color
// //   const getStockStatusColor = (status: string) => {
// //     switch (status) {
// //       case 'out_of_stock': return 'bg-red-100 text-red-800';
// //       case 'low_stock': return 'bg-yellow-100 text-yellow-800';
// //       case 'in_stock': return 'bg-green-100 text-green-800';
// //       default: return 'bg-gray-100 text-gray-800';
// //     }
// //   };

// //   // Get low stock products
// //   const lowStockProducts = products.filter(product => 
// //     product.stock_status === 'low_stock' || product.stock_status === 'out_of_stock'
// //   );

// //   // Edit a product
// //   const handleEdit = (product: ProductWithStock) => {
// //     // Create a deep copy of the product to avoid reference issues
// //     const productCopy = {
// //       ...product,
// //       // Ensure all fields have default values
// //       full_description: product.full_description || '',
// //       ingredients: product.ingredients || '',
// //       usage_instructions: product.usage_instructions || '',
// //       stock_quantity: product.stock_quantity || 0,
// //       min_stock_level: product.min_stock_level || 10,
// //       max_stock_level: product.max_stock_level || 100
// //     };
    
// //     console.log('Editing product:', productCopy);
// //     setEditingProduct(productCopy);
// //     setIsAddingNew(false);
// //   };

// //   // Update product in edit mode - IMPROVED VERSION
// //   const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
// //     if (!editingProduct) return;
    
// //     const { name, value, type } = e.target;
// //     let processedValue: any = value;
    
// //     // Handle number inputs
// //     if (type === 'number') {
// //       processedValue = value === '' ? 0 : parseFloat(value) || 0;
// //     }
    
// //     console.log(`Updating field ${name} to:`, processedValue);
    
// //     setEditingProduct(prev => ({
// //       ...prev!,
// //       [name]: processedValue
// //     }));
// //   };

// //   // Save edited product - IMPROVED VERSION
// //   const handleSaveEdit = () => {
// //     if (!editingProduct) return;
    
// //     console.log('Saving edited product:', editingProduct);
    
// //     // Validate required fields
// //     if (!editingProduct.title || !editingProduct.price || !editingProduct.unit) {
// //       toast({
// //         title: "Validation Error",
// //         description: "Title, price, and unit are required fields.",
// //         variant: "destructive"
// //       });
// //       return;
// //     }
    
// //     updateProduct.mutate(editingProduct, {
// //       onSuccess: () => {
// //         setEditingProduct(null);
// //       },
// //       onError: (error) => {
// //         console.error('Failed to update product:', error);
// //       }
// //     });
// //   };

// //   // Cancel edit
// //   const handleCancelEdit = () => {
// //     setEditingProduct(null);
// //   };

// //   // Delete a product
// //   const handleDelete = (id: string) => {
// //     if (window.confirm('Are you sure you want to delete this product?')) {
// //       deleteProduct.mutate(id);
// //     }
// //   };

// //   // Add new product form handlers
// //   const handleNewProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
// //     const value = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
// //     setNewProduct({
// //       ...newProduct,
// //       [e.target.name]: value
// //     });
// //   };

// //   const handleCancelNew = () => {
// //     setIsAddingNew(false);
// //     setNewProduct({
// //       title: '',
// //       image: '',
// //       price: '',
// //       unit: '',
// //       description: '',
// //       full_description: '',
// //       ingredients: '',
// //       usage_instructions: '',
// //       stock_quantity: 0,
// //       min_stock_level: 10,
// //       max_stock_level: 100
// //     });
// //   };

// //   const handleSaveNew = () => {
// //     if (!newProduct.title || !newProduct.price || !newProduct.unit) {
// //       toast({
// //         title: "Missing information",
// //         description: "Please fill in at least the title, price, and unit fields.",
// //         variant: "destructive"
// //       });
// //       return;
// //     }

// //     const productToAdd = {
// //       ...newProduct,
// //       title: newProduct.title ?? '',
// //       image: newProduct.image ?? 'https://images.unsplash.com/photo-1550583724-b2692b85b150?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
// //       price: newProduct.price ?? '0',
// //       unit: newProduct.unit ?? 'unit',
// //       description: newProduct.description ?? '',
// //       stock_quantity: newProduct.stock_quantity ?? 0,
// //       min_stock_level: newProduct.min_stock_level ?? 10,
// //       max_stock_level: newProduct.max_stock_level ?? 100
// //     };
    
// //     createProduct.mutate(productToAdd, {
// //       onSuccess: () => {
// //         setIsAddingNew(false);
// //         setNewProduct({
// //           title: '',
// //           image: '',
// //           price: '',
// //           unit: '',
// //           description: '',
// //           full_description: '',
// //           ingredients: '',
// //           usage_instructions: '',
// //           stock_quantity: 0,
// //           min_stock_level: 10,
// //           max_stock_level: 100
// //         });
// //       }
// //     });
// //   };

// //   // Calculate sales data
// //   const calculateSalesData = (orders: Order[]) => {
// //     const salesByMonth = {};
// //     orders.forEach(order => {
// //       const month = format(new Date(order.created_at), 'MMM yyyy');
// //       salesByMonth[month] = (salesByMonth[month] || 0) + order.total;
// //     });
    
// //     const labels = Object.keys(salesByMonth);
// //     const data = Object.values(salesByMonth);
    
// //     return { labels, data };
// //   };

// //   // Calculate order statistics
// //   const calculateOrderStats = (orders: Order[]) => {
// //     const totalOrders = orders.length;
// //     const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
// //     const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
// //     const statusCounts = orders.reduce((acc, order) => {
// //       acc[order.status] = (acc[order.status] || 0) + 1;
// //       return acc;
// //     }, {} as Record<string, number>);
    
// //     return { totalOrders, totalRevenue, averageOrderValue, statusCounts };
// //   };

// //   // Sales analytics component
// //   const SalesAnalytics = ({ orders }: { orders: Order[] }) => {
// //     const salesData = calculateSalesData(orders);
// //     const orderStats = calculateOrderStats(orders);

// //     const lineChartData = {
// //       labels: salesData.labels,
// //       datasets: [
// //         {
// //           label: 'Monthly Sales',
// //           data: salesData.data,
// //           fill: false,
// //           borderColor: 'rgb(75, 192, 192)',
// //           tension: 0.1,
// //         },
// //       ],
// //     };

// //     const lineChartOptions = {
// //       responsive: true,
// //       plugins: {
// //         legend: {
// //           position: 'top' as const,
// //         },
// //         title: {
// //           display: true,
// //           text: 'Monthly Sales Trend',
// //         },
// //       },
// //     };

// //     return (
// //       <div className="space-y-6">
// //         <div className="bg-white p-6 rounded-lg shadow">
// //           <h3 className="text-lg font-semibold mb-4">Sales Overview</h3>
// //           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
// //             <div className="p-4 bg-blue-50 rounded-lg">
// //               <h4 className="text-sm font-medium text-blue-600">Total Orders</h4>
// //               <p className="text-2xl font-bold">{orderStats.totalOrders}</p>
// //             </div>
// //             <div className="p-4 bg-green-50 rounded-lg">
// //               <h4 className="text-sm font-medium text-green-600">Total Revenue</h4>
// //               <p className="text-2xl font-bold">₹{orderStats.totalRevenue.toFixed(2)}</p>
// //             </div>
// //             <div className="p-4 bg-purple-50 rounded-lg">
// //               <h4 className="text-sm font-medium text-purple-600">Average Order Value</h4>
// //               <p className="text-2xl font-bold">₹{orderStats.averageOrderValue.toFixed(2)}</p>
// //             </div>
// //           </div>
// //         </div>

// //         {/* Stock Alerts */}
// //         {lowStockProducts.length > 0 && (
// //           <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-400">
// //             <h3 className="text-lg font-semibold mb-4 flex items-center">
// //               <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
// //               Stock Alerts
// //             </h3>
// //             <div className="space-y-2">
// //               {lowStockProducts.map(product => (
// //                 <div key={product.id} className="flex justify-between items-center p-3 bg-yellow-50 rounded">
// //                   <div>
// //                     <span className="font-medium">{product.title}</span>
// //                     <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStockStatusColor(product.stock_status)}`}>
// //                       {product.stock_quantity} {product.unit} remaining
// //                     </span>
// //                   </div>
// //                   <Button 
// //                     size="sm" 
// //                     onClick={() => handleStockUpdate(product)}
// //                     variant="outline"
// //                   >
// //                     <Package className="w-4 h-4 mr-1" />
// //                     Restock
// //                   </Button>
// //                 </div>
// //               ))}
// //             </div>
// //           </div>
// //         )}

// //         <div className="bg-white p-6 rounded-lg shadow">
// //           <h3 className="text-lg font-semibold mb-4">Sales Trend</h3>
// //           <div className="h-[400px]">
// //             <Line data={lineChartData} options={lineChartOptions} />
// //           </div>
// //         </div>

// //         <div className="bg-white p-6 rounded-lg shadow">
// //           <h3 className="text-lg font-semibold mb-4">Order Status Distribution</h3>
// //           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
// //             {Object.entries(orderStats.statusCounts).map(([status, count]) => (
// //               <div key={status} className="p-4 bg-gray-50 rounded-lg">
// //                 <h4 className="text-sm font-medium text-gray-600">{status}</h4>
// //                 <p className="text-xl font-bold">{count}</p>
// //               </div>
// //             ))}
// //           </div>
// //         </div>
// //       </div>
// //     );
// //   };

// //   return (
// //     <div className="container mx-auto py-10">
// //       <h1 className="text-3xl mt-9 font-bold mb-8">Admin Dashboard</h1>
      
// //       <Tabs defaultValue="products" className="w-full">
// //         <TabsList className="grid w-full grid-cols-4">
// //           <TabsTrigger value="products">Products</TabsTrigger>
// //           <TabsTrigger value="orders">Orders</TabsTrigger>
// //           <TabsTrigger value="users">Users</TabsTrigger>
// //           <TabsTrigger value="analytics">Analytics</TabsTrigger>
// //         </TabsList>
        
// //         <TabsContent value="products">
// //           <div className="bg-white rounded-lg shadow p-6">
// //             <div className="flex justify-between items-center mb-6">
// //               <h2 className="text-2xl font-semibold">Products & Stock Management</h2>
// //               {!isAddingNew && (
// //                 <Button onClick={() => {
// //                   setIsAddingNew(true);
// //                   setEditingProduct(null);
// //                 }}>
// //                   <Plus className="w-4 h-4 mr-2" />
// //                   Add New Product
// //                 </Button>
// //               )}
// //             </div>

// //             {isAddingNew && (
// //               <motion.div
// //                 initial={{ opacity: 0, y: -20 }}
// //                 animate={{ opacity: 1, y: 0 }}
// //                 className="mb-6 p-4 border rounded-lg"
// //               >
// //                 <h3 className="text-lg font-medium mb-4">Add New Product</h3>
                
// //                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
// //                   <div>
// //                     <label htmlFor="new-title" className="block text-sm font-medium mb-1">Title</label>
// //                     <Input 
// //                       id="new-title"
// //                       name="title"
// //                       value={newProduct.title ?? ''}
// //                       onChange={handleNewProductChange}
// //                       placeholder="Product title"
// //                     />
// //                   </div>
// //                   <div>
// //                     <label htmlFor="new-image" className="block text-sm font-medium mb-1">Image URL</label>
// //                     <Input 
// //                       id="new-image"
// //                       name="image"
// //                       value={newProduct.image ?? ''}
// //                       onChange={handleNewProductChange}
// //                       placeholder="https://example.com/image.jpg"
// //                     />
// //                   </div>
// //                   <div>
// //                     <label htmlFor="new-price" className="block text-sm font-medium mb-1">Price</label>
// //                     <Input 
// //                       id="new-price"
// //                       name="price"
// //                       value={newProduct.price ?? ''}
// //                       onChange={handleNewProductChange}
// //                       placeholder="100"
// //                     />
// //                   </div>
// //                   <div>
// //                     <label htmlFor="new-unit" className="block text-sm font-medium mb-1">Unit</label>
// //                     <Input 
// //                       id="new-unit"
// //                       name="unit"
// //                       value={newProduct.unit ?? ''}
// //                       onChange={handleNewProductChange}
// //                       placeholder="1 L, 500g, etc."
// //                     />
// //                   </div>
// //                 </div>

// //                 {/* Stock Management Fields */}
// //                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-blue-50 rounded-lg">
// //                   <div>
// //                     <label htmlFor="new-stock-quantity" className="block text-sm font-medium mb-1">Initial Stock Quantity</label>
// //                     <Input 
// //                       id="new-stock-quantity"
// //                       name="stock_quantity"
// //                       type="number"
// //                       min="0"
// //                       value={newProduct.stock_quantity ?? 0}
// //                       onChange={handleNewProductChange}
// //                       placeholder="0"
// //                     />
// //                   </div>
// //                   <div>
// //                     <label htmlFor="new-min-stock" className="block text-sm font-medium mb-1">Minimum Stock Level</label>
// //                     <Input 
// //                       id="new-min-stock"
// //                       name="min_stock_level"
// //                       type="number"
// //                       min="0"
// //                       value={newProduct.min_stock_level ?? 10}
// //                       onChange={handleNewProductChange}
// //                       placeholder="10"
// //                     />
// //                   </div>
// //                   <div>
// //                     <label htmlFor="new-max-stock" className="block text-sm font-medium mb-1">Maximum Stock Level</label>
// //                     <Input 
// //                       id="new-max-stock"
// //                       name="max_stock_level"
// //                       type="number"
// //                       min="0"
// //                       value={newProduct.max_stock_level ?? 100}
// //                       onChange={handleNewProductChange}
// //                       placeholder="100"
// //                     />
// //                   </div>
// //                 </div>
                
// //                 <div className="mb-4">
// //                   <label htmlFor="new-description" className="block text-sm font-medium mb-1">Short Description</label>
// //                   <Textarea 
// //                     id="new-description"
// //                     name="description"
// //                     value={newProduct.description ?? ''}
// //                     onChange={handleNewProductChange}
// //                     placeholder="Brief description for product card"
// //                     rows={2}
// //                   />
// //                 </div>
                
// //                 <div className="mb-4">
// //                   <label htmlFor="new-full-description" className="block text-sm font-medium mb-1">Full Description</label>
// //                   <Textarea 
// //                     id="new-full-description"
// //                     name="full_description"
// //                     value={newProduct.full_description ?? ''}
// //                     onChange={handleNewProductChange}
// //                     placeholder="Detailed product description"
// //                     rows={4}
// //                   />
// //                 </div>
                
// //                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
// //                   <div>
// //                     <label htmlFor="new-ingredients" className="block text-sm font-medium mb-1">Ingredients</label>
// //                     <Textarea 
// //                       id="new-ingredients"
// //                       name="ingredients"
// //                       value={newProduct.ingredients ?? ''}
// //                       onChange={handleNewProductChange}
// //                       placeholder="Product ingredients"
// //                       rows={3}
// //                     />
// //                   </div>
// //                   <div>
// //                     <label htmlFor="new-usage-instructions" className="block text-sm font-medium mb-1">Usage Instructions</label>
// //                     <Textarea 
// //                       id="new-usage-instructions"
// //                       name="usage_instructions"
// //                       value={newProduct.usage_instructions ?? ''}
// //                       onChange={handleNewProductChange}
// //                       placeholder="How to use the product"
// //                       rows={3}
// //                     />
// //                   </div>
// //                 </div>
                
// //                 <div className="flex justify-end space-x-2">
// //                   <Button variant="outline" onClick={handleCancelNew}>
// //                     <X className="mr-2 h-4 w-4" /> Cancel
// //                   </Button>
// //                   <Button onClick={handleSaveNew}>
// //                     <SaveIcon className="mr-2 h-4 w-4" /> Save Product
// //                   </Button>
// //                 </div>
// //               </motion.div>
// //             )}

// //             {editingProduct && (
// //               <motion.div
// //                 initial={{ opacity: 0, y: -20 }}
// //                 animate={{ opacity: 1, y: 0 }}
// //                 className="mb-6 p-4 border rounded-lg"
// //               >
// //                 <h3 className="text-lg font-medium mb-4">Edit Product</h3>
                
// //                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
// //                   <div>
// //                     <label htmlFor="edit-title" className="block text-sm font-medium mb-1">Title</label>
// //                     <Input 
// //                       id="edit-title"
// //                       name="title"
// //                       value={editingProduct.title || ''}
// //                       onChange={handleEditChange}
// //                       placeholder="Product title"
// //                     />
// //                   </div>
// //                   <div>
// //                     <label htmlFor="edit-image" className="block text-sm font-medium mb-1">Image URL</label>
// //                     <Input 
// //                       id="edit-image"
// //                       name="image"
// //                       value={editingProduct.image || ''}
// //                       onChange={handleEditChange}

// //                       placeholder="https://example.com/image.jpg"
// //                     />
// //                   </div>
// //                   <div>
// //                     <label htmlFor="edit-price" className="block text-sm font-medium mb-1">Price</label>
// //                     <Input 
// //                       id="edit-price"
// //                       name="price"
// //                       value={editingProduct.price}
// //                       onChange={handleEditChange}
// //                       placeholder="100"
// //                     />
// //                   </div>
// //                   <div>
// //                     <label htmlFor="edit-unit" className="block text-sm font-medium mb-1">Unit</label>
// //                     <Input 
// //                       id="edit-unit"
// //                       name="unit"
// //                       value={editingProduct.unit}
// //                       onChange={handleEditChange}
// //                       placeholder="1 L, 500g, etc."
// //                     />
// //                   </div>
// //                 </div>

// //                 {/* Stock Management Fields */}
// //                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-blue-50 rounded-lg">
// //                   <div>
// //                     <label htmlFor="edit-stock-quantity" className="block text-sm font-medium mb-1">Current Stock</label>
// //                     <Input 
// //                       id="edit-stock-quantity"
// //                       name="stock_quantity"
// //                       type="number"
// //                       min="0"
// //                       value={editingProduct.stock_quantity ?? 0}
// //                       onChange={handleEditChange}
// //                       placeholder="0"
// //                     />
// //                   </div>
// //                   <div>
// //                     <label htmlFor="edit-min-stock" className="block text-sm font-medium mb-1">Minimum Stock Level</label>
// //                     <Input 
// //                       id="edit-min-stock"
// //                       name="min_stock_level"
// //                       type="number"
// //                       min="0"
// //                       value={editingProduct.min_stock_level ?? 10}
// //                       onChange={handleEditChange}
// //                       placeholder="10"
// //                     />
// //                   </div>
// //                   <div>
// //                     <label htmlFor="edit-max-stock" className="block text-sm font-medium mb-1">Maximum Stock Level</label>
// //                     <Input 
// //                       id="edit-max-stock"
// //                       name="max_stock_level"
// //                       type="number"
// //                       min="0"
// //                       value={editingProduct.max_stock_level ?? 100}
// //                       onChange={handleEditChange}
// //                       placeholder="100"
// //                     />
// //                   </div>
// //                 </div>
                
// //                 <div className="mb-4">
// //                   <label htmlFor="edit-description" className="block text-sm font-medium mb-1">Short Description</label>
// //                   <Textarea 
// //                     id="edit-description"
// //                     name="description"
// //                     value={editingProduct.description}
// //                     onChange={handleEditChange}
// //                     placeholder="Brief description for product card"
// //                     rows={2}
// //                   />
// //                 </div>
                
// //                 <div className="mb-4">
// //                   <label htmlFor="edit-full-description" className="block text-sm font-medium mb-1">Full Description</label>
// //                   <Textarea 
// //                     id="edit-full-description"
// //                     name="full_description"
// //                     value={editingProduct.full_description || ''}
// //                     onChange={handleEditChange}
// //                     placeholder="Detailed product description"
// //                     rows={4}
// //                   />
// //                 </div>
                
// //                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
// //                   <div>
// //                     <label htmlFor="edit-ingredients" className="block text-sm font-medium mb-1">Ingredients</label>
// //                     <Textarea 
// //                       id="edit-ingredients"
// //                       name="ingredients"
// //                       value={editingProduct.ingredients || ''}
// //                       onChange={handleEditChange}
// //                       placeholder="Product ingredients"
// //                       rows={3}
// //                     />
// //                   </div>
// //                   <div>
// //                     <label htmlFor="edit-usage-instructions" className="block text-sm font-medium mb-1">Usage Instructions</label>
// //                     <Textarea 
// //                       id="edit-usage-instructions"
// //                       name="usage_instructions"
// //                       value={editingProduct.usage_instructions || ''}
// //                       onChange={handleEditChange}
// //                       placeholder="How to use the product"
// //                       rows={3}
// //                     />
// //                   </div>
// //                 </div>
                
// //                 <div className="flex justify-end space-x-2">
// //                   <Button variant="outline" onClick={handleCancelEdit}>
// //                     <X className="mr-2 h-4 w-4" /> Cancel
// //                   </Button>
// //                   <Button onClick={handleSaveEdit}>
// //                     <SaveIcon className="mr-2 h-4 w-4" /> Save Changes
// //                   </Button>
// //                 </div>
// //               </motion.div>
// //             )}

// //             {/* Stock Update Modal */}
// //             {stockUpdateProduct && (
// //               <motion.div
// //                 initial={{ opacity: 0 }}
// //                 animate={{ opacity: 1 }}
// //                 className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
// //                 onClick={() => setStockUpdateProduct(null)}
// //               >
// //                 <motion.div
// //                   initial={{ scale: 0.9, opacity: 0 }}
// //                   animate={{ scale: 1, opacity: 1 }}
// //                   className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4"
// //                   onClick={(e) => e.stopPropagation()}
// //                   onClick={(e) => e.stopPropagation()}
// //                 >
// //                   <h3 className="text-lg font-semibold mb-4">
// //                     Update Stock: {stockUpdateProduct.title}
// //                   </h3>
                  
// //                   <div className="mb-4">
// //                     <p className="text-sm text-gray-600 mb-2">
// //                       Current Stock: <span className="font-semibold">{stockUpdateProduct.stock_quantity} {stockUpdateProduct.unit}</span>
// //                     </p>
// //                     <div className={`inline-block px-2 py-1 rounded-full text-xs ${getStockStatusColor(stockUpdateProduct.stock_status)}`}>
// //                       {stockUpdateProduct.stock_status.replace('_', ' ').toUpperCase()}
// //                     </div>
// //                   </div>

// //                   <div className="mb-4">
// //                     <label htmlFor="stock-quantity" className="block text-sm font-medium mb-1">Quantity</label>
// //                     <Input
// //                       id="stock-quantity"
// //                       type="number"
// //                       min="0"
// //                       value={stockUpdateQuantity}
// //                       onChange={(e) => setStockUpdateQuantity(parseInt(e.target.value) || 0)}
// //                       placeholder="Enter quantity"
// //                     />
// //                   </div>

// //                   <div className="flex flex-wrap gap-2 mb-4">
// //                     <Button
// //                       onClick={() => handleStockSave('add')}
// //                       className="bg-green-600 hover:bg-green-700"
// //                       size="sm"
// //                     >
// //                       <Plus className="w-4 h-4 mr-1" />
// //                       Add Stock
// //                     </Button>
// //                     <Button
// //                       onClick={() => handleStockSave('subtract')}
// //                       variant="destructive"
// //                       size="sm"
// //                     >
// //                       <Trash2 className="w-4 h-4 mr-1" />
// //                       Remove Stock
// //                     </Button>
// //                     <Button
// //                       onClick={() => handleStockSave('set')}
// //                       variant="outline"
// //                       size="sm"
// //                         className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded shadow-sm transition-all duration-200"

// //                     >
// //                       <SaveIcon className="w-4 h-4 mr-1 bg-blend-color-blue " />
// //                       Set Exact to 0 
// //                     </Button>
                     
// //                       <Button
// //                          onClick={() => handleStockSave('add10')}
// //                          className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded shadow-sm transition-all duration-200"
// //                          size="sm"
// //                               >
// //                           <Plus className="w-4 h-4 mr-1" />
// //                           Add +10
// //                        </Button>

// //                   </div>

// //                   <div className="flex justify-end space-x-2">
// //                     <Button variant="outline" onClick={() => setStockUpdateProduct(null)}>
// //                       Cancel
// //                     </Button>
// //                   </div>
// //                 </motion.div>
// //               </motion.div>
// //             )}

// //             {/* Products Table */}
// //             <div className="overflow-x-auto">
// //               <Table>
// //                 <TableHeader>
// //                   <TableRow>
// //                     <TableHead>Product</TableHead>
// //                     <TableHead>Price</TableHead>
// //                     <TableHead>Unit</TableHead>
// //                     <TableHead>Stock Status</TableHead>
// //                     <TableHead>Current Stock</TableHead>
// //                     <TableHead>Min/Max Levels</TableHead>
// //                     <TableHead>Actions</TableHead>
// //                   </TableRow>
// //                 </TableHeader>
// //                 <TableBody>
// //                   {productsLoading ? (
// //                     <TableRow>
// //                       <TableCell colSpan={7} className="text-center py-8">
// //                         Loading products...
// //                       </TableCell>
// //                     </TableRow>
// //                   ) : productsError ? (
// //                     <TableRow>
// //                       <TableCell colSpan={7} className="text-center py-8 text-red-600">
// //                         Error loading products
// //                       </TableCell>
// //                     </TableRow>
// //                   ) : products.length === 0 ? (
// //                     <TableRow>
// //                       <TableCell colSpan={7} className="text-center py-8">
// //                         No products found
// //                       </TableCell>
// //                     </TableRow>
// //                   ) : (
// //                     products.map((product) => (
// //                       <TableRow key={product.id}>
// //                         <TableCell>
// //                           <div className="flex items-center space-x-3">
// //                             <img 
// //                               src={product.image} 
// //                               alt={product.title}
// //                               className="w-12 h-12 object-cover rounded"
// //                               onError={(e) => {
// //                                 e.currentTarget.src = 'https://images.unsplash.com/photo-1550583724-b2692b85b150?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
// //                               }}
// //                             />
// //                             <div>
// //                               <div className="font-medium">{product.title}</div>
// //                               <div className="text-sm text-gray-500 truncate max-w-xs">
// //                                 {product.description}
// //                               </div>
// //                             </div>
// //                           </div>
// //                         </TableCell>
// //                         <TableCell>₹{product.price}</TableCell>
// //                         <TableCell>{product.unit}</TableCell>
// //                         <TableCell>
// //                           <span className={`px-2 py-1 rounded-full text-xs ${getStockStatusColor(product.stock_status)}`}>
// //                             {product.stock_status.replace('_', ' ').toUpperCase()}
// //                           </span>
// //                         </TableCell>
// //                         <TableCell>
// //                           <div className="flex items-center space-x-2">
// //                             <span className="font-medium">{product.stock_quantity}</span>
// //                             <span className="text-sm text-gray-500">{product.unit}</span>
// //                             {product.stock_status !== 'in_stock' && (
// //                               <AlertTriangle className="w-4 h-4 text-yellow-500" />
// //                             )}
// //                           </div>
// //                         </TableCell>
// //                         <TableCell>
// //                           <div className="text-sm">
// //                             <div>Min: {product.min_stock_level || 10}</div>
// //                             <div>Max: {product.max_stock_level || 100}</div>
// //                           </div>
// //                         </TableCell>
// //                         <TableCell>
// //                           <div className="flex space-x-2">
// //                             <Button
// //                               size="sm"
// //                               variant="outline"
// //                               onClick={() => handleStockUpdate(product)}
// //                             >
// //                               <Package className="w-4 h-4" />
// //                             </Button>
// //                             <Button
// //                               size="sm"
// //                               variant="outline"
// //                               onClick={() => handleEdit(product)}
// //                             >
// //                               <Pencil className="w-4 h-4" />
// //                             </Button>
// //                             <Button
// //                               size="sm"
// //                               variant="destructive"
// //                               onClick={() => handleDelete(product.id)}
// //                             >
// //                               <Trash2 className="w-4 h-4" />
// //                             </Button>
// //                           </div>
// //                         </TableCell>
// //                       </TableRow>
// //                     ))
// //                   )}
// //                 </TableBody>
// //               </Table>
// //             </div>
// //           </div>
// //         </TabsContent>
        
// //         <TabsContent value="orders">
// //           <div className="bg-white rounded-lg shadow p-6">
// //             <h2 className="text-2xl font-semibold mb-6">Orders Management</h2>
            
// //             <div className="overflow-x-auto">
// //               <Table>
// //                 <TableHeader>
// //                   <TableRow>
// //                     <TableHead>Order ID</TableHead>
// //                     <TableHead>Date</TableHead>
// //                     <TableHead>Status</TableHead>
// //                     <TableHead>Total</TableHead>
// //                     <TableHead>Customer</TableHead>
// //                     <TableHead>Actions</TableHead>
// //                   </TableRow>
// //                 </TableHeader>
// //                 <TableBody>
// //                   {ordersLoading ? (
// //                     <TableRow>
// //                       <TableCell colSpan={6} className="text-center py-8">
// //                         Loading orders...
// //                       </TableCell>
// //                     </TableRow>
// //                   ) : orders.length === 0 ? (
// //                     <TableRow>
// //                       <TableCell colSpan={6} className="text-center py-8">
// //                         No orders found
// //                       </TableCell>
// //                     </TableRow>
// //                   ) : (
// //                     orders.map((order) => (
// //                       <React.Fragment key={order.id}>
// //                         <TableRow>
// //                           <TableCell className="font-mono">
// //                             {order.id.slice(0, 8)}...
// //                           </TableCell>
// //                           <TableCell>
// //                             {format(new Date(order.created_at), 'MMM dd, yyyy')}
// //                           </TableCell>
// //                           <TableCell>
// //                             <span className={`px-2 py-1 rounded-full text-xs ${
// //                               order.status === 'completed' ? 'bg-green-100 text-green-800' :
// //                               order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
// //                               order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
// //                               'bg-blue-100 text-blue-800'
// //                             }`}>
// //                               {order.status.toUpperCase()}
// //                             </span>
// //                           </TableCell>
// //                           <TableCell>₹{order.total.toFixed(2)}</TableCell>
// //                           <TableCell>
// //                             <div className="text-sm">
// //                               <div>{order.name || 'N/A'}</div>
// //                               <div className="text-gray-500">{order.email || 'N/A'}</div>
// //                             </div>
// //                           </TableCell>
// //                           <TableCell>
// //                             <Button
// //                               size="sm"
// //                               variant="outline"
// //                               onClick={() => setExpandedOrderId(
// //                                 expandedOrderId === order.id ? null : order.id
// //                               )}
// //                             >
// //                               {expandedOrderId === order.id ? 'Hide' : 'View'} Details
// //                             </Button>
// //                           </TableCell>
// //                         </TableRow>
// //                         {expandedOrderId === order.id && (
// //                           <TableRow>
// //                             <TableCell colSpan={6}>
// //                               <motion.div
// //                                 initial={{ opacity: 0, height: 0 }}
// //                                 animate={{ opacity: 1, height: 'auto' }}
// //                                 exit={{ opacity: 0, height: 0 }}
// //                                 className="p-4 bg-gray-50 rounded"
// //                               >
// //                                 <h4 className="font-semibold mb-2">Order Details</h4>
// //                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
// //                                   <div>
// //                                     <p><strong>Phone:</strong> {order.phone || 'N/A'}</p>
// //                                     <p><strong>Address:</strong> {order.address || 'N/A'}</p>
// //                                     <p><strong>City:</strong> {order.city || 'N/A'}</p>
// //                                     <p><strong>State:</strong> {order.state || 'N/A'}</p>
// //                                     <p><strong>ZIP:</strong> {order.zip_code || 'N/A'}</p>
// //                                   </div>
// //                                   <div>
// //                                     <p><strong>Order Date:</strong> {format(new Date(order.created_at), 'PPP')}</p>
// //                                     <p><strong>Last Updated:</strong> {format(new Date(order.updated_at), 'PPP')}</p>
// //                                   </div>
// //                                 </div>
// //                               </motion.div>
// //                             </TableCell>
// //                           </TableRow>
// //                         )}
// //                       </React.Fragment>
// //                     ))
// //                   )}
// //                 </TableBody>
// //               </Table>
// //             </div>
// //           </div>
// //         </TabsContent>
        
// //         <TabsContent value="users">
// //           <div className="bg-white rounded-lg shadow p-6">
// //             <h2 className="text-2xl font-semibold mb-6">
// //               <Users className="inline-block w-6 h-6 mr-2" />
// //               Users Management
// //             </h2>
            
// //             <div className="overflow-x-auto">
// //               <Table>
// //                 <TableHeader>
// //                   <TableRow>
// //                     <TableHead>User ID</TableHead>
// //                     <TableHead>Email</TableHead>
// //                     <TableHead>Joined</TableHead>
// //                     <TableHead>Last Updated</TableHead>
// //                   </TableRow>
// //                 </TableHeader>
// //                 <TableBody>
// //                   {profilesLoading ? (
// //                     <TableRow>
// //                       <TableCell colSpan={4} className="text-center py-8">
// //                         Loading users...
// //                       </TableCell>
// //                     </TableRow>
// //                   ) : profiles.length === 0 ? (
// //                     <TableRow>
// //                       <TableCell colSpan={4} className="text-center py-8">
// //                         No users found
// //                       </TableCell>
// //                     </TableRow>
// //                   ) : (
// //                     profiles.map((profile) => (
// //                       <TableRow key={profile.id}>
// //                         <TableCell className="font-mono">
// //                           {profile.id.slice(0, 8)}...
// //                         </TableCell>
// //                         <TableCell>{profile.email}</TableCell>
// //                         <TableCell>
// //                           {format(new Date(profile.created_at), 'MMM dd, yyyy')}
// //                         </TableCell>
// //                         <TableCell>
// //                           {format(new Date(profile.updated_at), 'MMM dd, yyyy')}
// //                         </TableCell>
// //                       </TableRow>
// //                     ))
// //                   )}
// //                 </TableBody>
// //               </Table>
// //             </div>
// //           </div>
// //         </TabsContent>
        
// //         <TabsContent value="analytics">
// //           <SalesAnalytics orders={orders} />
// //         </TabsContent>
// //       </Tabs>
// //     </div>
// //   );
// // };

// // export default Admin;

// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';

// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow
// } from '@/components/ui/table';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Textarea } from '@/components/ui/textarea';
// import { useToast } from '@/hooks/use-toast';
// import { supabase } from '@/integrations/supabase/client';
// import { Product } from '@/types/products';
// import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
// import { CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Title, Tooltip } from 'chart.js';
// import { format } from 'date-fns';
// import { motion } from 'framer-motion';
// import { AlertTriangle, ChevronDown, ChevronUp, Package, Pencil, Plus, SaveIcon, Trash2, X } from 'lucide-react';
// import React, { useState } from 'react';
// import { Line } from 'react-chartjs-2';

// // Initialize Chart.js
// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   Title,
//   Tooltip,
//   Legend
// );

// interface Order {
//   id: string;
//   created_at: string;
//   status: string;
//   total: number;
//   user_id: string;
//   updated_at: string;
//   name?: string;
//   email?: string;
//   phone?: string;
//   address?: string;
//   city?: string;
//   state?: string;
//   zip_code?: string;
// }

// interface Profile {
//   id: string;
//   email: string;
//   created_at: string;
//   updated_at: string;
// }

// // Enhanced Product interface with stock management
// interface ProductWithStock extends Product {
//   stock_quantity: number;
//   min_stock_level: number;
//   max_stock_level: number;
//   stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
// }

// const Admin = () => {
//   const { toast } = useToast();
//   const queryClient = useQueryClient();
//   const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
//   const [editingProduct, setEditingProduct] = useState<ProductWithStock | null>(null);
//   const [isAddingNew, setIsAddingNew] = useState(false);
//   const [stockUpdateProduct, setStockUpdateProduct] = useState<ProductWithStock | null>(null);
//   const [stockUpdateQuantity, setStockUpdateQuantity] = useState<number>(0);
//   const [newProduct, setNewProduct] = useState<Partial<ProductWithStock>>({
//     title: '',
//     image: '',
//     price: '',
//     unit: '',
//     description: '',
//     full_description: '',
//     ingredients: '',
//     usage_instructions: '',
//     stock_quantity: 0,
//     min_stock_level: 10,
//     max_stock_level: 100
//   });

//   // Fetch products with stock information
//   const { data: products = [], isLoading: productsLoading, error: productsError } = useQuery<ProductWithStock[]>({
//     queryKey: ['admin-products'],
//     queryFn: async () => {
//       const { data, error } = await supabase
//         .from('products')
//         .select('*, stock_quantity, min_stock_level, max_stock_level')
//         .order('created_at', { ascending: false });
        
//       if (error) throw error;
      
//       // Calculate stock status for each product
//       return data.map(product => ({
//         ...product,
//         stock_status: product.stock_quantity <= 0 ? 'out_of_stock' : 
//                     product.stock_quantity <= (product.min_stock_level || 10) ? 'low_stock' : 
//                     'in_stock'
//       })) as ProductWithStock[];
//     },
//   });


// //  fetching code 
// const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
//   queryKey: ['admin-orders'],
//   queryFn: async () => {
//     const { data, error } = await supabase
//       .from('orders')
//       .select(`
//         *,
//         profiles!orders_user_id_fkey (
//           id,
//           email,
//           full_name
//         )
//       `)
//       .order('created_at', { ascending: false });
      
//     if (error) throw error;
//     return data as Order[];
//   },
// });


//   // Fetch profiles
//   const { data: profiles = [], isLoading: profilesLoading } = useQuery<Profile[]>({
//     queryKey: ['admin-profiles'],
//     queryFn: async () => {
//       const { data, error } = await supabase
//         .from('profiles')
//         .select('*')
//         .order('created_at', { ascending: false });
        
//       if (error) throw error;
//       return data as Profile[];
//     },
//   });

//   // Create product mutation with stock
//   const createProduct = useMutation({
//     mutationFn: async (product: Partial<ProductWithStock>) => {
//       const { data, error } = await supabase
//         .from('products')
//         .insert([{
//           ...product,
//           stock_quantity: product.stock_quantity || 0,
//           min_stock_level: product.min_stock_level || 10,
//           max_stock_level: product.max_stock_level || 100
//         }])
//         .select();
        
//       if (error) throw error;
//       return data[0];
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['admin-products'] });
//       queryClient.invalidateQueries({ queryKey: ['products'] });
//       toast({
//         title: "Product added",
//         description: "The product has been added successfully with stock information."
//       });
//     },
//     onError: (error) => {
//       console.error("Error adding product:", error);
//       toast({
//         title: "Error",
//         description: "There was a problem adding the product.",
//         variant: "destructive"
//       });
//     }
//   });

//   // Update product mutation - FIXED VERSION
//   const updateProduct = useMutation({
//     mutationFn: async (product: ProductWithStock) => {
//       // Create a clean update object without the id and computed fields
//       const updateFields = {
//         title: product.title,
//         image: product.image,
//         price: product.price,
//         unit: product.unit,
//         description: product.description,
//         full_description: product.full_description,
//         ingredients: product.ingredients,
//         usage_instructions: product.usage_instructions,
//         stock_quantity: product.stock_quantity,
//         min_stock_level: product.min_stock_level,
//         max_stock_level: product.max_stock_level,
//         updated_at: new Date().toISOString()
//       };

//       console.log('Updating product with ID:', product.id);
//       console.log('Update fields:', updateFields);

//       const { data, error } = await supabase
//         .from('products')
//         .update(updateFields)
//         .eq('id', product.id)
//         .select();
      
//       if (error) {
//         console.error('Supabase update error:', error);
//         throw error;
//       }
      
//       console.log('Update successful:', data);
//       return data[0];
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['admin-products'] });
//       queryClient.invalidateQueries({ queryKey: ['products'] });
//       queryClient.invalidateQueries({ queryKey: ['product'] });
//       toast({
//         title: "Product updated",
//         description: "The product has been updated successfully."
//       });
//     },
//     onError: (error) => {
//       console.error("Error updating product:", error);
//       toast({
//         title: "Error",
//         description: `There was a problem updating the product: ${error.message}`,
//         variant: "destructive"
//       });
//     }
//   });

//   // Update stock mutation
//   const updateStock = useMutation({
//     mutationFn: async ({ productId, newQuantity, operation }: { productId: string, newQuantity: number, operation: 'add' | 'subtract' | 'set' }) => {
//       const { data: currentProduct, error: fetchError } = await supabase
//         .from('products')
//         .select('stock_quantity')
//         .eq('id', productId)
//         .single();

//       if (fetchError) throw fetchError;

//       let finalQuantity = newQuantity;
//       if (operation === 'add') {
//         finalQuantity = currentProduct.stock_quantity + newQuantity;
//       } else if (operation === 'subtract') {
//         finalQuantity = Math.max(0, currentProduct.stock_quantity - newQuantity);
//       }

//       const { data, error } = await supabase
//         .from('products')
//         .update({ 
//           stock_quantity: finalQuantity,
//           updated_at: new Date().toISOString()
//         })
//         .eq('id', productId)
//         .select();
        
//       if (error) throw error;
//       return data[0];
//     },
//     onSuccess: (data, variables) => {
//       queryClient.invalidateQueries({ queryKey: ['admin-products'] });
//       queryClient.invalidateQueries({ queryKey: ['products'] });
//       toast({
//         title: "Stock updated",
//         description: `Stock has been updated successfully.`
//       });
//     },
//     onError: (error) => {
//       console.error("Error updating stock:", error);
//       toast({
//         title: "Error",
//         description: "There was a problem updating the stock.",
//         variant: "destructive"
//       });
//     }
//   });

//   // Delete product mutation
//   const deleteProduct = useMutation({
//     mutationFn: async (id: string) => {
//       const { error } = await supabase
//         .from('products')
//         .delete()
//         .eq('id', id);
        
//       if (error) throw error;
//       return id;
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['admin-products'] });
//       queryClient.invalidateQueries({ queryKey: ['products'] });
//       toast({
//         title: "Product deleted",
//         description: "The product has been removed successfully."
//       });
//     },
//     onError: (error) => {
//       console.error("Error deleting product:", error);
//       toast({
//         title: "Error",
//         description: "There was a problem deleting the product.",
//         variant: "destructive"
//       });
//     }
//   });

//   // Stock management functions
//   const handleStockUpdate = (product: ProductWithStock) => {
//     setStockUpdateProduct(product);
//     setStockUpdateQuantity(0);
//   };

//   const handleStockSave = (operation: 'add' | 'subtract' | 'set' | 'add10') => {
//     if (!stockUpdateProduct) return;

//     let quantity = stockUpdateQuantity;
//     if (operation === 'add10') {
//       quantity = 10;
//       operation = 'add';
//     }

//     updateStock.mutate({
//       productId: stockUpdateProduct.id,
//       newQuantity: quantity,
//       operation
//     }, {
//       onSuccess: () => {
//         setStockUpdateProduct(null);
//         setStockUpdateQuantity(0);
//       }
//     });
//   };

//   // Get stock status color
//   const getStockStatusColor = (status: string) => {
//     switch (status) {
//       case 'out_of_stock': return 'bg-red-100 text-red-800';
//       case 'low_stock': return 'bg-yellow-100 text-yellow-800';
//       case 'in_stock': return 'bg-green-100 text-green-800';
//       default: return 'bg-gray-100 text-gray-800';
//     }
//   };

//   // Get low stock products
//   const lowStockProducts = products.filter(product => 
//     product.stock_status === 'low_stock' || product.stock_status === 'out_of_stock'
//   );

//   // Edit a product
//   const handleEdit = (product: ProductWithStock) => {
//     // Create a deep copy of the product to avoid reference issues
//     const productCopy = {
//       ...product,
//       // Ensure all fields have default values
//       full_description: product.full_description || '',
//       ingredients: product.ingredients || '',
//       usage_instructions: product.usage_instructions || '',
//       stock_quantity: product.stock_quantity || 0,
//       min_stock_level: product.min_stock_level || 10,
//       max_stock_level: product.max_stock_level || 100
//     };
    
//     console.log('Editing product:', productCopy);
//     setEditingProduct(productCopy);
//     setIsAddingNew(false);
//   };

//   // Update product in edit mode - IMPROVED VERSION
//   const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//     if (!editingProduct) return;
    
//     const { name, value, type } = e.target;
//     let processedValue: any = value;
    
//     // Handle number inputs
//     if (type === 'number') {
//       processedValue = value === '' ? 0 : parseFloat(value) || 0;
//     }
    
//     console.log(`Updating field ${name} to:`, processedValue);
    
//     setEditingProduct(prev => ({
//       ...prev!,
//       [name]: processedValue
//     }));
//   };

//   // Save edited product - IMPROVED VERSION
//   const handleSaveEdit = () => {
//     if (!editingProduct) return;
    
//     console.log('Saving edited product:', editingProduct);
    
//     // Validate required fields
//     if (!editingProduct.title || !editingProduct.price || !editingProduct.unit) {
//       toast({
//         title: "Validation Error",
//         description: "Title, price, and unit are required fields.",
//         variant: "destructive"
//       });
//       return;
//     }
    
//     updateProduct.mutate(editingProduct, {
//       onSuccess: () => {
//         setEditingProduct(null);
//       },
//       onError: (error) => {
//         console.error('Failed to update product:', error);
//       }
//     });
//   };

//   // Cancel edit
//   const handleCancelEdit = () => {
//     setEditingProduct(null);
//   };

//   // Delete a product
//   const handleDelete = (id: string) => {
//     if (window.confirm('Are you sure you want to delete this product?')) {
//       deleteProduct.mutate(id);
//     }
//   };

//   // Add new product form handlers
//   const handleNewProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//     const value = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
//     setNewProduct({
//       ...newProduct,
//       [e.target.name]: value
//     });
//   };

//   const handleCancelNew = () => {
//     setIsAddingNew(false);
//     setNewProduct({
//       title: '',
//       image: '',
//       price: '',
//       unit: '',
//       description: '',
//       full_description: '',
//       ingredients: '',
//       usage_instructions: '',
//       stock_quantity: 0,
//       min_stock_level: 10,
//       max_stock_level: 100
//     });
//   };

//   const handleSaveNew = () => {
//     if (!newProduct.title || !newProduct.price || !newProduct.unit) {
//       toast({
//         title: "Missing information",
//         description: "Please fill in at least the title, price, and unit fields.",
//         variant: "destructive"
//       });
//       return;
//     }

//     const productToAdd = {
//       ...newProduct,
//       title: newProduct.title ?? '',
//       image: newProduct.image ?? 'https://images.unsplash.com/photo-1550583724-b2692b85b150?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
//       price: newProduct.price ?? '0',
//       unit: newProduct.unit ?? 'unit',
//       description: newProduct.description ?? '',
//       stock_quantity: newProduct.stock_quantity ?? 0,
//       min_stock_level: newProduct.min_stock_level ?? 10,
//       max_stock_level: newProduct.max_stock_level ?? 100
//     };
    
//     createProduct.mutate(productToAdd, {
//       onSuccess: () => {
//         setIsAddingNew(false);
//         setNewProduct({
//           title: '',
//           image: '',
//           price: '',
//           unit: '',
//           description: '',
//           full_description: '',
//           ingredients: '',
//           usage_instructions: '',
//           stock_quantity: 0,
//           min_stock_level: 10,
//           max_stock_level: 100
//         });
//       }
//     });
//   };

//   // FIXED: Toggle order expansion function
//   const toggleOrderExpansion = (orderId: string) => {
//     setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
//   };

//   // Calculate sales data
//   const calculateSalesData = (orders: Order[]) => {
//     const salesByMonth = {};
//     orders.forEach(order => {
//       const month = format(new Date(order.created_at), 'MMM yyyy');
//       salesByMonth[month] = (salesByMonth[month] || 0) + order.total;
//     });
    
//     const labels = Object.keys(salesByMonth);
//     const data = Object.values(salesByMonth);
    
//     return { labels, data };
//   };

//   // Calculate order statistics
//   const calculateOrderStats = (orders: Order[]) => {
//     const totalOrders = orders.length;
//     const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
//     const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
//     const statusCounts = orders.reduce((acc, order) => {
//       acc[order.status] = (acc[order.status] || 0) + 1;
//       return acc;
//     }, {} as Record<string, number>);
    
//     return { totalOrders, totalRevenue, averageOrderValue, statusCounts };
//   };

//   // Sales analytics component
//   const SalesAnalytics = ({ orders }: { orders: Order[] }) => {
//     const salesData = calculateSalesData(orders);
//     const orderStats = calculateOrderStats(orders);

//     const lineChartData = {
//       labels: salesData.labels,
//       datasets: [
//         {
//           label: 'Monthly Sales',
//           data: salesData.data,
//           fill: false,
//           borderColor: 'rgb(75, 192, 192)',
//           tension: 0.1,
//         },
//       ],
//     };

//     const lineChartOptions = {
//       responsive: true,
//       plugins: {
//         legend: {
//           position: 'top' as const,
//         },
//         title: {
//           display: true,
//           text: 'Monthly Sales Trend',
//         },
//       },
//     };

//     return (
//       <div className="space-y-6">
//         <div className="bg-white p-6 rounded-lg shadow">
//           <h3 className="text-lg font-semibold mb-4">Sales Overview</h3>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div className="p-4 bg-blue-50 rounded-lg">
//               <h4 className="text-sm font-medium text-blue-600">Total Orders</h4>
//               <p className="text-2xl font-bold">{orderStats.totalOrders}</p>
//             </div>
//             <div className="p-4 bg-green-50 rounded-lg">
//               <h4 className="text-sm font-medium text-green-600">Total Revenue</h4>
//               <p className="text-2xl font-bold">₹{orderStats.totalRevenue.toFixed(2)}</p>
//             </div>
//             <div className="p-4 bg-purple-50 rounded-lg">
//               <h4 className="text-sm font-medium text-purple-600">Average Order Value</h4>
//               <p className="text-2xl font-bold">₹{orderStats.averageOrderValue.toFixed(2)}</p>
//             </div>
//           </div>
//         </div>

//         {/* Stock Alerts */}
//         {lowStockProducts.length > 0 && (
//           <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-400">
//             <h3 className="text-lg font-semibold mb-4 flex items-center">
//               <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
//               Stock Alerts
//             </h3>
//             <div className="space-y-2">
//               {lowStockProducts.map(product => (
//                 <div key={product.id} className="flex justify-between items-center p-3 bg-yellow-50 rounded">
//                   <div>
//                     <span className="font-medium">{product.title}</span>
//                     <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStockStatusColor(product.stock_status)}`}>
//                       {product.stock_quantity} {product.unit} remaining
//                     </span>
//                   </div>
//                   <Button 
//                     size="sm" 
//                     onClick={() => handleStockUpdate(product)}
//                     variant="outline"
//                   >
//                     <Package className="w-4 h-4 mr-1" />
//                     Restock
//                   </Button>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}

//         <div className="bg-white p-6 rounded-lg shadow">
//           <h3 className="text-lg font-semibold mb-4">Sales Trend</h3>
//           <div className="h-[400px]">
//             <Line data={lineChartData} options={lineChartOptions} />
//           </div>
//         </div>

//         <div className="bg-white p-6 rounded-lg shadow">
//           <h3 className="text-lg font-semibold mb-4">Order Status Distribution</h3>
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//             {Object.entries(orderStats.statusCounts).map(([status, count]) => (
//               <div key={status} className="p-4 bg-gray-50 rounded-lg">
//                 <h4 className="text-sm font-medium text-gray-600">{status}</h4>
//                 <p className="text-xl font-bold">{count}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className="container mx-auto py-10">
//       <h1 className="text-3xl mt-9 font-bold mb-8">Admin Dashboard</h1>
      
//       <Tabs defaultValue="products" className="w-full">
//         <TabsList className="grid w-full grid-cols-4">
//           <TabsTrigger value="products">Products</TabsTrigger>
//           <TabsTrigger value="orders">Orders</TabsTrigger>
//           <TabsTrigger value="users">Users</TabsTrigger>
//           <TabsTrigger value="analytics">Analytics</TabsTrigger>
//         </TabsList>
        
//         <TabsContent value="products">
//           <div className="bg-white rounded-lg shadow p-6">
//             <div className="flex justify-between items-center mb-6">
//               <h2 className="text-2xl font-semibold">Products & Stock Management</h2>
//               {!isAddingNew && (
//                 <Button onClick={() => {
//                   setIsAddingNew(true);
//                   setEditingProduct(null);
//                 }}>
//                   <Plus className="w-4 h-4 mr-2" />
//                   Add New Product
//                 </Button>
//               )}
//             </div>

//             {isAddingNew && (
//               <motion.div
//                 initial={{ opacity: 0, y: -20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 className="mb-6 p-4 border rounded-lg"
//               >
//                 <h3 className="text-lg font-medium mb-4">Add New Product</h3>
                
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                   <div>
//                     <label htmlFor="new-title" className="block text-sm font-medium mb-1">Title</label>
//                     <Input 
//                       id="new-title"
//                       name="title"
//                       value={newProduct.title ?? ''}
//                       onChange={handleNewProductChange}
//                       placeholder="Product title"
//                     />
//                   </div>
//                   <div>
//                     <label htmlFor="new-image" className="block text-sm font-medium mb-1">Image URL</label>
//                     <Input 
//                       id="new-image"
//                       name="image"
//                       value={newProduct.image ?? ''}
//                       onChange={handleNewProductChange}
//                       placeholder="https://example.com/image.jpg"
//                     />
//                   </div>
//                   <div>
//                     <label htmlFor="new-price" className="block text-sm font-medium mb-1">Price</label>
//                     <Input 
//                       id="new-price"
//                       name="price"
//                       value={newProduct.price ?? ''}
//                       onChange={handleNewProductChange}
//                       placeholder="100"
//                     />
//                   </div>
//                   <div>
//                     <label htmlFor="new-unit" className="block text-sm font-medium mb-1">Unit</label>
//                     <Input 
//                       id="new-unit"
//                       name="unit"
//                       value={newProduct.unit ?? ''}
//                       onChange={handleNewProductChange}
//                       placeholder="1 L, 500g, etc."
//                     />
//                   </div>
//                 </div>

//                 {/* Stock Management Fields */}
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-blue-50 rounded-lg">
//                   <div>
//                     <label htmlFor="new-stock-quantity" className="block text-sm font-medium mb-1">Initial Stock Quantity</label>
//                     <Input 
//                       id="new-stock-quantity"
//                       name="stock_quantity"
//                       type="number"
//                       min="0"
//                       value={newProduct.stock_quantity ?? 0}
//                       onChange={handleNewProductChange}
//                       placeholder="0"
//                     />
//                   </div>
//                   <div>
//                     <label htmlFor="new-min-stock" className="block text-sm font-medium mb-1">Minimum Stock Level</label>
//                     <Input 
//                       id="new-min-stock"
//                       name="min_stock_level"
//                       type="number"
//                       min="0"
//                       value={newProduct.min_stock_level ?? 10}
//                       onChange={handleNewProductChange}
//                       placeholder="10"
//                     />
//                   </div>
//                   <div>
//                     <label htmlFor="new-max-stock" className="block text-sm font-medium mb-1">Maximum Stock Level</label>
//                     <Input 
//                       id="new-max-stock"
//                       name="max_stock_level"
//                       type="number"
//                       min="0"
//                       value={newProduct.max_stock_level ?? 100}
//                       onChange={handleNewProductChange}
//                       placeholder="100"
//                     />
//                   </div>
//                 </div>
                
//                 <div className="mb-4">
//                   <label htmlFor="new-description" className="block text-sm font-medium mb-1">Short Description</label>
//                   <Textarea 
//                     id="new-description"
//                     name="description"
//                     value={newProduct.description ?? ''}
//                     onChange={handleNewProductChange}
//                     placeholder="Brief description for product card"
//                     rows={2}
//                   />
//                 </div>
                
//                 <div className="mb-4">
//                   <label htmlFor="new-full-description" className="block text-sm font-medium mb-1">Full Description</label>
//                   <Textarea 
//                     id="new-full-description"
//                     name="full_description"
//                     value={newProduct.full_description ?? ''}
//                     onChange={handleNewProductChange}
//                     placeholder="Detailed product description"
//                     rows={4}
//                   />
//                 </div>
                
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
//                   <div>
//                     <label htmlFor="new-ingredients" className="block text-sm font-medium mb-1">Ingredients</label>
//                     <Textarea 
//                       id="new-ingredients"
//                       name="ingredients"
//                       value={newProduct.ingredients ?? ''}
//                       onChange={handleNewProductChange}
//                       placeholder="Product ingredients"
//                       rows={3}
//                     />
//                   </div>
//                   <div>
//                     <label htmlFor="new-usage-instructions" className="block text-sm font-medium mb-1">Usage Instructions</label>
//                     <Textarea 
//                       id="new-usage-instructions"
//                       name="usage_instructions"
//                       value={newProduct.usage_instructions ?? ''}
//                       onChange={handleNewProductChange}
//                       placeholder="How to use the product"
//                       rows={3}
//                     />
//                   </div>
//                 </div>
                
//                 <div className="flex justify-end space-x-2">
//                   <Button variant="outline" onClick={handleCancelNew}>
//                     <X className="mr-2 h-4 w-4" /> Cancel
//                   </Button>
//                   <Button onClick={handleSaveNew}>
//                     <SaveIcon className="mr-2 h-4 w-4" /> Save Product
//                   </Button>
//                 </div>
//               </motion.div>
//             )}

//             {editingProduct && (
//               <motion.div
//                 initial={{ opacity: 0, y: -20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 className="mb-6 p-4 border rounded-lg"
//               >
//                 <h3 className="text-lg font-medium mb-4">Edit Product</h3>
                
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                   <div>
//                     <label htmlFor="edit-title" className="block text-sm font-medium mb-1">Title</label>
//                     <Input 
//                       id="edit-title"
//                       name="title"
//                       value={editingProduct.title || ''}
//                       onChange={handleEditChange}
//                       placeholder="Product title"
//                     />
//                   </div>
//                   <div>
//                   <label htmlFor="edit-image" className="block text-sm font-medium mb-1">Image URL</label>
//                     <Input 
//                       id="edit-image"
//                       name="image"
//                       value={editingProduct.image || ''}
//                       onChange={handleEditChange}
//                       placeholder="https://example.com/image.jpg"
//                     />
//                   </div>
//                   <div>
//                     <label htmlFor="edit-price" className="block text-sm font-medium mb-1">Price</label>
//                     <Input 
//                       id="edit-price"
//                       name="price"
//                       value={editingProduct.price || ''}
//                       onChange={handleEditChange}
//                       placeholder="100"
//                     />
//                   </div>
//                   <div>
//                     <label htmlFor="edit-unit" className="block text-sm font-medium mb-1">Unit</label>
//                     <Input 
//                       id="edit-unit"
//                       name="unit"
//                       value={editingProduct.unit || ''}
//                       onChange={handleEditChange}
//                       placeholder="1 L, 500g, etc."
//                     />
//                   </div>
//                 </div>

//                 {/* Stock Management Fields */}
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-blue-50 rounded-lg">
//                   <div>
//                     <label htmlFor="edit-stock-quantity" className="block text-sm font-medium mb-1">Current Stock Quantity</label>
//                     <Input 
//                       id="edit-stock-quantity"
//                       name="stock_quantity"
//                       type="number"
//                       min="0"
//                       value={editingProduct.stock_quantity || 0}
//                       onChange={handleEditChange}
//                       placeholder="0"
//                     />
//                   </div>
//                   <div>
//                     <label htmlFor="edit-min-stock" className="block text-sm font-medium mb-1">Minimum Stock Level</label>
//                     <Input 
//                       id="edit-min-stock"
//                       name="min_stock_level"
//                       type="number"
//                       min="0"
//                       value={editingProduct.min_stock_level || 10}
//                       onChange={handleEditChange}
//                       placeholder="10"
//                     />
//                   </div>
//                   <div>
//                     <label htmlFor="edit-max-stock" className="block text-sm font-medium mb-1">Maximum Stock Level</label>
//                     <Input 
//                       id="edit-max-stock"
//                       name="max_stock_level"
//                       type="number"
//                       min="0"
//                       value={editingProduct.max_stock_level || 100}
//                       onChange={handleEditChange}
//                       placeholder="100"
//                     />
//                   </div>
//                 </div>
                
//                 <div className="mb-4">
//                   <label htmlFor="edit-description" className="block text-sm font-medium mb-1">Short Description</label>
//                   <Textarea 
//                     id="edit-description"
//                     name="description"
//                     value={editingProduct.description || ''}
//                     onChange={handleEditChange}
//                     placeholder="Brief description for product card"
//                     rows={2}
//                   />
//                 </div>
                
//                 <div className="mb-4">
//                   <label htmlFor="edit-full-description" className="block text-sm font-medium mb-1">Full Description</label>
//                   <Textarea 
//                     id="edit-full-description"
//                     name="full_description"
//                     value={editingProduct.full_description || ''}
//                     onChange={handleEditChange}
//                     placeholder="Detailed product description"
//                     rows={4}
//                   />
//                 </div>
                
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
//                   <div>
//                     <label htmlFor="edit-ingredients" className="block text-sm font-medium mb-1">Ingredients</label>
//                     <Textarea 
//                       id="edit-ingredients"
//                       name="ingredients"
//                       value={editingProduct.ingredients || ''}
//                       onChange={handleEditChange}
//                       placeholder="Product ingredients"
//                       rows={3}
//                     />
//                   </div>
//                   <div>
//                     <label htmlFor="edit-usage-instructions" className="block text-sm font-medium mb-1">Usage Instructions</label>
//                     <Textarea 
//                       id="edit-usage-instructions"
//                       name="usage_instructions"
//                       value={editingProduct.usage_instructions || ''}
//                       onChange={handleEditChange}
//                       placeholder="How to use the product"
//                       rows={3}
//                     />
//                   </div>
//                 </div>
                
//                 <div className="flex justify-end space-x-2">
//                   <Button variant="outline" onClick={handleCancelEdit}>
//                     <X className="mr-2 h-4 w-4" /> Cancel
//                   </Button>
//                   <Button onClick={handleSaveEdit}>
//                     <SaveIcon className="mr-2 h-4 w-4" /> Save Changes
//                   </Button>
//                 </div>
//               </motion.div>
//             )}

//             {productsLoading ? (
//               <div className="text-center py-8">Loading products...</div>
//             ) : productsError ? (
//               <div className="text-center py-8 text-red-600">
//                 Error loading products: {productsError.message}
//               </div>
//             ) : (
//               <Table>
//                 <TableHeader>
//                   <TableRow>
//                     <TableHead>Image</TableHead>
//                     <TableHead>Title</TableHead>
//                     <TableHead>Price</TableHead>
//                     <TableHead>Unit</TableHead>
//                     <TableHead>Stock</TableHead>
//                     <TableHead>Status</TableHead>
//                     <TableHead>Actions</TableHead>
//                   </TableRow>
//                 </TableHeader>
//                 <TableBody>
//                   {products.map((product) => (
//                     <TableRow key={product.id}>
//                       <TableCell>
//                         <img 
//                           src={product.image} 
//                           alt={product.title} 
//                           className="w-12 h-12 object-cover rounded"
//                         />
//                       </TableCell>
//                       <TableCell className="font-medium">{product.title}</TableCell>
//                       <TableCell>₹{product.price}</TableCell>
//                       <TableCell>{product.unit}</TableCell>
//                       <TableCell>{product.stock_quantity}</TableCell>
//                       <TableCell>
//                         <span className={`px-2 py-1 rounded-full text-xs ${getStockStatusColor(product.stock_status)}`}>
//                           {product.stock_status.replace('_', ' ')}
//                         </span>
//                       </TableCell>
//                       <TableCell>
//                         <div className="flex space-x-2">
//                           <Button 
//                             size="sm" 
//                             variant="outline"
//                             onClick={() => handleEdit(product)}
//                           >
//                             <Pencil className="w-4 h-4" />
//                           </Button>
//                           <Button 
//                             size="sm" 
//                             variant="outline"
//                             onClick={() => handleStockUpdate(product)}
//                           >
//                             <Package className="w-4 h-4" />
//                           </Button>
//                           <Button 
//                             size="sm" 
//                             variant="destructive"
//                             onClick={() => handleDelete(product.id)}
//                           >
//                             <Trash2 className="w-4 h-4" />
//                           </Button>
//                         </div>
//                       </TableCell>
//                     </TableRow>
//                   ))}
//                 </TableBody>
//               </Table>
//             )}
//           </div>
//         </TabsContent>
        
//         <TabsContent value="orders">
//           <div className="bg-white rounded-lg shadow p-6">
//             <h2 className="text-2xl font-semibold mb-6">Orders</h2>
            
//             {ordersLoading ? (
//               <div className="text-center py-8">Loading orders...</div>
//             ) : (
//               <div className="space-y-4">
//                 {orders.map((order) => (
//                   <div key={order.id} className="border rounded-lg p-4">
//                     <div 
//                       className="flex justify-between items-center cursor-pointer"
//                       onClick={() => toggleOrderExpansion(order.id)}
//                     >
//                       <div className="flex items-center space-x-4">
//                         <div>
//                           <p className="font-medium">Order #{order.id.slice(-8)}</p>
//                           <p className="text-sm text-gray-600">
//                             {format(new Date(order.created_at), 'MMM dd, yyyy')}
//                           </p>
//                         </div>
//                         <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
//                           {order.status}
//                         </div>
//                       </div>
//                       <div className="flex items-center space-x-4">
//                         <span className="font-semibold">₹{order.total.toFixed(2)}</span>
//                         {expandedOrderId === order.id ? (
//                           <ChevronUp className="w-5 h-5" />
//                         ) : (
//                           <ChevronDown className="w-5 h-5" />
//                         )}
//                       </div>
//                     </div>
                    
//                     {expandedOrderId === order.id && (
//                       <motion.div
//                         initial={{ opacity: 0, height: 0 }}
//                         animate={{ opacity: 1, height: 'auto' }}
//                         exit={{ opacity: 0, height: 0 }}
//                         className="mt-4 pt-4 border-t"
//                       >
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                           <div>
//                             <h4 className="font-medium mb-2">Customer Information</h4>
//                             <p><strong>Name:</strong> {order.name || 'N/A'}</p>
//                             <p><strong>Email:</strong> {order.email || 'N/A'}</p>
//                             <p><strong>Phone:</strong> {order.phone || 'N/A'}</p>
//                           </div>
//                           <div>
//                             <h4 className="font-medium mb-2">Shipping Address</h4>
//                             <p>{order.address || 'N/A'}</p>
//                             <p>{order.city || 'N/A'}, {order.state || 'N/A'} {order.zip_code || 'N/A'}</p>
//                           </div>
//                         </div>
//                       </motion.div>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         </TabsContent>
        
//         <TabsContent value="users">
//           <div className="bg-white rounded-lg shadow p-6">
//             <h2 className="text-2xl font-semibold mb-6">Users</h2>
            
//             {profilesLoading ? (
//               <div className="text-center py-8">Loading users...</div>
//             ) : (
//               <Table>
//                 <TableHeader>
//                   <TableRow>
//                     <TableHead>User ID</TableHead>
//                     <TableHead>Email</TableHead>
//                     <TableHead>Created At</TableHead>
//                     <TableHead>Last Updated</TableHead>
//                   </TableRow>
//                 </TableHeader>
//                 <TableBody>
//                   {profiles.map((profile) => (
//                     <TableRow key={profile.id}>
//                       <TableCell className="font-mono text-sm">{profile.id}</TableCell>
//                       <TableCell>{profile.email}</TableCell>
//                       <TableCell>
//                         {format(new Date(profile.created_at), 'MMM dd, yyyy')}
//                       </TableCell>
//                       <TableCell>
//                         {format(new Date(profile.updated_at), 'MMM dd, yyyy')}
//                       </TableCell>
//                     </TableRow>
//                   ))}
//                 </TableBody>
//               </Table>
//             )}
//           </div>
//         </TabsContent>
        
//         <TabsContent value="analytics">
//           <SalesAnalytics orders={orders} />
//         </TabsContent>
//       </Tabs>

//       {/* Stock Update Modal */}
//       {stockUpdateProduct && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
//             <h3 className="text-lg font-semibold mb-4">
//               Update Stock for {stockUpdateProduct.title}
//             </h3>
            
//             <div className="mb-4">
//               <p className="text-sm text-gray-600 mb-2">
//                 Current Stock: {stockUpdateProduct.stock_quantity} {stockUpdateProduct.unit}
//               </p>
//               <div className="flex items-center space-x-2 mb-2">
//                 <span className={`px-2 py-1 rounded-full text-xs ${getStockStatusColor(stockUpdateProduct.stock_status)}`}>
//                   {stockUpdateProduct.stock_status.replace('_', ' ')}
//                 </span>
//               </div>
//             </div>
            
//             <div className="mb-4">
//               <label className="block text-sm font-medium mb-1">Quantity</label>
//               <Input 
//                 type="number" 
//                 value={stockUpdateQuantity}
//                 onChange={(e) => setStockUpdateQuantity(parseInt(e.target.value) || 0)}
//                 placeholder="Enter quantity"
//                 min="0"
//               />
//             </div>
            
//             <div className="flex flex-wrap gap-2 mb-4">
//               <Button 
//                 size="sm" 
//                 variant="outline"
//                 onClick={() => handleStockSave('add')}
//                 disabled={stockUpdateQuantity <= 0}
//               >
//                 Add {stockUpdateQuantity}
//               </Button>
//               <Button 
//                 size="sm" 
//                 variant="outline"
//                 onClick={() => handleStockSave('subtract')}
//                 disabled={stockUpdateQuantity <= 0}
//               >
//                 Remove {stockUpdateQuantity}
//               </Button>
//               <Button 
//                 size="sm" 
//                 variant="outline"
//                 onClick={() => handleStockSave('set')}
//                 disabled={stockUpdateQuantity < 0}
//               >
//                 Set to {stockUpdateQuantity}
//               </Button>
//               <Button 
//                 size="sm" 
//                 variant="secondary"
//                 onClick={() => handleStockSave('add10')}
//               >
//                 Quick Add 10
//               </Button>
//             </div>
            
//             <div className="flex justify-end space-x-2">
//               <Button 
//                 variant="outline" 
//                 onClick={() => {
//                   setStockUpdateProduct(null);
//                   setStockUpdateQuantity(0);
//                 }}
//               >
//                 Cancel
//               </Button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Admin;


import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
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
import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';

// Initialize Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Order {
  id: string;
  created_at: string;
  status: string;
  total: number;
  user_id: string;
  updated_at: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
}

interface Profile {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

// Enhanced Product interface with stock management
interface ProductWithStock extends Product {
  stock_quantity: number;
  min_stock_level: number;
  max_stock_level: number;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

const Admin = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductWithStock | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [stockUpdateProduct, setStockUpdateProduct] = useState<ProductWithStock | null>(null);
  const [stockUpdateQuantity, setStockUpdateQuantity] = useState<number>(0);
  const [newProduct, setNewProduct] = useState<Partial<ProductWithStock>>({
    title: '',
    image: '',
    price: '',
    unit: '',
    description: '',
    full_description: '',
    ingredients: '',
    usage_instructions: '',
    stock_quantity: 0,
    min_stock_level: 10,
    max_stock_level: 100
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
      
      // Calculate stock status for each product
      return data.map(product => ({
        ...product,
        stock_status: product.stock_quantity <= 0 ? 'out_of_stock' : 
                    product.stock_quantity <= (product.min_stock_level || 10) ? 'low_stock' : 
                    'in_stock'
      })) as ProductWithStock[];
    },
  });

  // Fetch orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data as Order[];
    },
  });

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
      console.error("Error adding product:", error);
      toast({
        title: "Error",
        description: "There was a problem adding the product.",
        variant: "destructive"
      });
    }
  });

  // Update product mutation - FIXED VERSION
  const updateProduct = useMutation({
    mutationFn: async (product: ProductWithStock) => {
      // Create a clean update object without the id and computed fields
      const updateFields = {
        title: product.title,
        image: product.image,
        price: product.price,
        unit: product.unit,
        description: product.description,
        full_description: product.full_description,
        ingredients: product.ingredients,
        usage_instructions: product.usage_instructions,
        stock_quantity: product.stock_quantity,
        min_stock_level: product.min_stock_level,
        max_stock_level: product.max_stock_level,
        updated_at: new Date().toISOString()
      };

      console.log('Updating product with ID:', product.id);
      console.log('Update fields:', updateFields);

      const { data, error } = await supabase
        .from('products')
        .update(updateFields)
        .eq('id', product.id)
        .select();
      
      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }
      
      console.log('Update successful:', data);
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      toast({
        title: "Product updated",
        description: "The product has been updated successfully."
      });
    },
    onError: (error) => {
      console.error("Error updating product:", error);
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
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Stock updated",
        description: `Stock has been updated successfully.`
      });
    },
    onError: (error) => {
      console.error("Error updating stock:", error);
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
      console.error("Error deleting product:", error);
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
    if (operation === 'add10') {
      quantity = 10;
      operation = 'add';
    }

    updateStock.mutate({
      productId: stockUpdateProduct.id,
      newQuantity: quantity,
      operation
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
    // Create a deep copy of the product to avoid reference issues
    const productCopy = {
      ...product,
      // Ensure all fields have default values
      full_description: product.full_description || '',
      ingredients: product.ingredients || '',
      usage_instructions: product.usage_instructions || '',
      stock_quantity: product.stock_quantity || 0,
      min_stock_level: product.min_stock_level || 10,
      max_stock_level: product.max_stock_level || 100
    };
    
    console.log('Editing product:', productCopy);
    setEditingProduct(productCopy);
    setIsAddingNew(false);
  };

  // Update product in edit mode - IMPROVED VERSION
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editingProduct) return;
    
    const { name, value, type } = e.target;
    let processedValue: any = value;
    
    // Handle number inputs
    if (type === 'number') {
      processedValue = value === '' ? 0 : parseFloat(value) || 0;
    }
    
    console.log(`Updating field ${name} to:`, processedValue);
    
    setEditingProduct(prev => ({
      ...prev!,
      [name]: processedValue
    }));
  };

  // Save edited product - IMPROVED VERSION
  const handleSaveEdit = () => {
    if (!editingProduct) return;
    
    console.log('Saving edited product:', editingProduct);
    
    // Validate required fields
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
      },
      onError: (error) => {
        console.error('Failed to update product:', error);
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
      title: '',
      image: '',
      price: '',
      unit: '',
      description: '',
      full_description: '',
      ingredients: '',
      usage_instructions: '',
      stock_quantity: 0,
      min_stock_level: 10,
      max_stock_level: 100
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
        setNewProduct({
          title: '',
          image: '',
          price: '',
          unit: '',
          description: '',
          full_description: '',
          ingredients: '',
          usage_instructions: '',
          stock_quantity: 0,
          min_stock_level: 10,
          max_stock_level: 100
        });
      }
    });
  };

  // FIXED: Toggle order expansion function
  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  // Calculate sales data
  const calculateSalesData = (orders: Order[]) => {
    const salesByMonth = {};
    orders.forEach(order => {
      const month = format(new Date(order.created_at), 'MMM yyyy');
      salesByMonth[month] = (salesByMonth[month] || 0) + order.total;
    });
    
    const labels = Object.keys(salesByMonth);
    const data = Object.values(salesByMonth);
    
    return { labels, data };
  };

  // Calculate order statistics
  const calculateOrderStats = (orders: Order[]) => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
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
                    placeholder="Detailed product description"
                    rows={4}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label htmlFor="new-ingredients" className="block text-sm font-medium mb-1">Ingredients</label>
                    <Textarea 
                      id="new-ingredients"
                      name="ingredients"
                      value={newProduct.ingredients ?? ''}
                      onChange={handleNewProductChange}
                      placeholder="Product ingredients"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label htmlFor="new-usage-instructions" className="block text-sm font-medium mb-1">Usage Instructions</label>
                    <Textarea 
                      id="new-usage-instructions"
                      name="usage_instructions"
                      value={newProduct.usage_instructions ?? ''}
                      onChange={handleNewProductChange}
                      placeholder="How to use the product"
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={handleCancelNew}>
                    <X className="mr-2 h-4 w-4" /> Cancel
                  </Button>
                  <Button onClick={handleSaveNew}>
                    <SaveIcon className="mr-2 h-4 w-4" /> Save Product
                  </Button>
                </div>
              </motion.div>
            )}

            {editingProduct && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 border rounded-lg"
              >
                <h3 className="text-lg font-medium mb-4">Edit Product</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="edit-title" className="block text-sm font-medium mb-1">Title</label>
                    <Input 
                      id="edit-title"
                      name="title"
                      value={editingProduct.title || ''}
                      onChange={handleEditChange}
                      placeholder="Product title"
                    />
                  </div>
                  <div>
                  <label htmlFor="edit-image" className="block text-sm font-medium mb-1">Image URL</label>
                    <Input 
                      id="edit-image"
                      name="image"
                      value={editingProduct.image || ''}
                      onChange={handleEditChange}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-price" className="block text-sm font-medium mb-1">Price</label>
                    <Input 
                      id="edit-price"
                      name="price"
                      value={editingProduct.price || ''}
                      onChange={handleEditChange}
                      placeholder="100"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-unit" className="block text-sm font-medium mb-1">Unit</label>
                    <Input 
                      id="edit-unit"
                      name="unit"
                      value={editingProduct.unit || ''}
                      onChange={handleEditChange}
                      placeholder="1 L, 500g, etc."
                    />
                  </div>
                </div>

                {/* Stock Management Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-blue-50 rounded-lg">
                  <div>
                    <label htmlFor="edit-stock-quantity" className="block text-sm font-medium mb-1">Current Stock Quantity</label>
                    <Input 
                      id="edit-stock-quantity"
                      name="stock_quantity"
                      type="number"
                      min="0"
                      value={editingProduct.stock_quantity || 0}
                      onChange={handleEditChange}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-min-stock" className="block text-sm font-medium mb-1">Minimum Stock Level</label>
                    <Input 
                      id="edit-min-stock"
                      name="min_stock_level"
                      type="number"
                      min="0"
                      value={editingProduct.min_stock_level || 10}
                      onChange={handleEditChange}
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-max-stock" className="block text-sm font-medium mb-1">Maximum Stock Level</label>
                    <Input 
                      id="edit-max-stock"
                      name="max_stock_level"
                      type="number"
                      min="0"
                      value={editingProduct.max_stock_level || 100}
                      onChange={handleEditChange}
                      placeholder="100"
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="edit-description" className="block text-sm font-medium mb-1">Short Description</label>
                  <Textarea 
                    id="edit-description"
                    name="description"
                    value={editingProduct.description || ''}
                    onChange={handleEditChange}
                    placeholder="Brief description for product card"
                    rows={2}
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="edit-full-description" className="block text-sm font-medium mb-1">Full Description</label>
                  <Textarea 
                    id="edit-full-description"
                    name="full_description"
                    value={editingProduct.full_description || ''}
                    onChange={handleEditChange}
                    placeholder="Detailed product description"
                    rows={4}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label htmlFor="edit-ingredients" className="block text-sm font-medium mb-1">Ingredients</label>
                    <Textarea 
                      id="edit-ingredients"
                      name="ingredients"
                      value={editingProduct.ingredients || ''}
                      onChange={handleEditChange}
                      placeholder="Product ingredients"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-usage-instructions" className="block text-sm font-medium mb-1">Usage Instructions</label>
                    <Textarea 
                      id="edit-usage-instructions"
                      name="usage_instructions"
                      value={editingProduct.usage_instructions || ''}
                      onChange={handleEditChange}
                      placeholder="How to use the product"
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={handleCancelEdit}>
                    <X className="mr-2 h-4 w-4" /> Cancel
                  </Button>
                  <Button onClick={handleSaveEdit}>
                    <SaveIcon className="mr-2 h-4 w-4" /> Save Changes
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
                      <TableCell className="font-medium">{product.title}</TableCell>
                      <TableCell>₹{product.price}</TableCell>
                      <TableCell>{product.unit}</TableCell>
                      <TableCell>{product.stock_quantity}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStockStatusColor(product.stock_status)}`}>
                          {product.stock_status.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEdit(product)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleStockUpdate(product)}
                          >
                            <Package className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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
            <h2 className="text-2xl font-semibold mb-6">Orders</h2>
            
            {ordersLoading ? (
              <div className="text-center py-8">Loading orders...</div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4">
                    <div 
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() => toggleOrderExpansion(order.id)}
                    >
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="font-medium">Order #{order.id.slice(-8)}</p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(order.created_at), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {order.status}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="font-semibold">₹{order.total.toFixed(2)}</span>
                        {expandedOrderId === order.id ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                    
                    {expandedOrderId === order.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium mb-2">Customer Information</h4>
                            <p><strong>Name:</strong> {order.name || 'N/A'}</p>
                            <p><strong>Email:</strong> {order.email || 'N/A'}</p>
                            <p><strong>Phone:</strong> {order.phone || 'N/A'}</p>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Shipping Address</h4>
                            <p>{order.address || 'N/A'}</p>
                            <p>{order.city || 'N/A'}, {order.state || 'N/A'} {order.zip_code || 'N/A'}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="users">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-6">Users</h2>
            
            {profilesLoading ? (
              <div className="text-center py-8">Loading users...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell className="font-mono text-sm">{profile.id}</TableCell>
                      <TableCell>{profile.email}</TableCell>
                      <TableCell>
                        {format(new Date(profile.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        {format(new Date(profile.updated_at), 'MMM dd, yyyy')}
                      </TableCell>
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
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Update Stock for {stockUpdateProduct.title}
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Current Stock: {stockUpdateProduct.stock_quantity} {stockUpdateProduct.unit}
              </p>
              <div className="flex items-center space-x-2 mb-2">
                <span className={`px-2 py-1 rounded-full text-xs ${getStockStatusColor(stockUpdateProduct.stock_status)}`}>
                  {stockUpdateProduct.stock_status.replace('_', ' ')}
                </span>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Quantity</label>
              <Input 
                type="number" 
                value={stockUpdateQuantity}
                onChange={(e) => setStockUpdateQuantity(parseInt(e.target.value) || 0)}
                placeholder="Enter quantity"
                min="0"
              />
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleStockSave('add')}
                disabled={stockUpdateQuantity <= 0}
              >
                Add {stockUpdateQuantity}
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleStockSave('subtract')}
                disabled={stockUpdateQuantity <= 0}
              >
                Remove {stockUpdateQuantity}
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleStockSave('set')}
                disabled={stockUpdateQuantity < 0}
              >
                Set to {stockUpdateQuantity}
              </Button>
              <Button 
                size="sm" 
                variant="secondary"
                onClick={() => handleStockSave('add10')}
              >
                Quick Add 10
              </Button>
            </div>
            
            <div className="flex justify-end space-x-2">
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
      )}
    </div>
  );
};

export default Admin;