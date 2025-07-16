// import { Badge } from '@/components/ui/badge';
// import { Button } from '@/components/ui/button';
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow
// } from '@/components/ui/table';
// import { useAuth } from '@/contexts/AuthContext';
// import { supabase } from '@/integrations/supabase/client';
// import { useQuery } from '@tanstack/react-query';
// import { motion } from 'framer-motion';
// import React from 'react';
// import { useNavigate } from 'react-router-dom';

// // Define order status colors
// const STATUS_COLORS: Record<string, string> = {
//   pending: 'bg-yellow-500',
//   paid: 'bg-green-500',
//   shipped: 'bg-blue-500',
//   delivered: 'bg-green-700',
//   failed: 'bg-red-500'
// };

// const Orders: React.FC = () => {
//   const { user } = useAuth();
//   const navigate = useNavigate();

//   // Fetch user's orders with order items
//   const { 
//     data: orders, 
//     isLoading, 
//     error 
//   } = useQuery({
//     queryKey: ['orders', user?.id],
//     queryFn: async () => {
//       if (!user) return [];

//       // Fetch orders with their items
//       const { data, error } = await supabase
//         .from('orders')
//         .select(`
//           id, 
//           total, 
//           status, 
//           created_at,
//           order_items (
//             id, 
//             product_id, 
//             quantity, 
//             price
//           )
//         `)
//         .eq('user_id', user.id)
//         .order('created_at', { ascending: false });

//       if (error) throw error;
//       return data || [];
//     },
//     enabled: !!user
//   });

//   if (isLoading) {
//     return (
//       <div className="pt-28 pb-20 section-container flex justify-center">
//         <p>Loading orders...</p>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="pt-28 pb-20 section-container flex justify-center text-red-500">
//         <p>Error loading orders: {error.message}</p>
//       </div>
//     );
//   }

//   if (!orders || orders.length === 0) {
//     return (
//       <div className="pt-28 pb-20 section-container flex flex-col items-center">
//         <p className="mb-4">You haven't placed any orders yet.</p>
//         <Button onClick={() => navigate('/')}>
//           Continue Shopping
//         </Button>
//       </div>
//     );
//   }

//   return (
//     <motion.main
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       exit={{ opacity: 0 }}
//       transition={{ duration: 0.5 }}
//       className="pt-28 pb-20"
//     >
//       <div className="section-container">
//         <h1 className="text-3xl font-display font-bold mb-8">My Orders</h1>
        
//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead>Order ID</TableHead>
//               <TableHead>Date</TableHead>
//               <TableHead>Total</TableHead>
//               <TableHead>Status</TableHead>
//               {/* <TableHead>Actions</TableHead> */}
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {orders.map((order) => {
//               const orderDate = new Date(order.created_at);
//               const totalItems = order.order_items.reduce(
//                 (sum, item) => sum + item.quantity, 
//                 0
//               );

//               return (
//                 <TableRow key={order.id}>
//                   <TableCell>#{order.id}</TableCell>
//                   <TableCell>
//                     {orderDate.toLocaleDateString('en-IN', {
//                       day: 'numeric',
//                       month: 'short',
//                       year: 'numeric'
//                     })}
//                   </TableCell>
//                   <TableCell>₹{order.total.toFixed(2)}</TableCell>
//                   <TableCell>
//                     <Badge 
//                       className={`${STATUS_COLORS[order.status] || 'bg-gray-500'} text-white`}
//                     >
//                       {order.status}
//                     </Badge>
//                   </TableCell>
//                   {/* <TableCell>
//                     <Button 
//                       variant="outline" 
//                       size="sm"
//                       onClick={() => navigate(`/orders/${order.id}`)}
//                     >
//                       View Details
//                     </Button>
//                   </TableCell> */}
//                 </TableRow>
//               );
//             })}
//           </TableBody>
//         </Table>
//       </div>
//     </motion.main>
//   );
// };

// export default Orders;

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle, ChevronDown, ChevronUp, Clock, Package, Truck, XCircle } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Define order status colors and icons
const STATUS_CONFIG = {
  pending: { 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
    icon: Clock,
    label: 'Cash on Delivery'
  },
  paid: { 
    color: 'bg-green-100 text-green-800 border-green-200', 
    icon: CheckCircle,
    label: 'Paid'
  },
  shipped: { 
    color: 'bg-blue-100 text-blue-800 border-blue-200', 
    icon: Truck,
    label: 'Shipped'
  },
  delivered: { 
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200', 
    icon: Package,
    label: 'Delivered'
  },
  failed: { 
    color: 'bg-red-100 text-red-800 border-red-200', 
    icon: XCircle,
    label: 'Failed'
  }
};

// Payment method labels
const PAYMENT_METHODS = {
  cod: 'Cash on Delivery',
  online: 'Online Payment',
  card: 'Card Payment',
  upi: 'UPI Payment',
  wallet: 'Wallet Payment'
};

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  products?: {
    title: string;
    image?: string;
  };
}

interface Order {
  id: string;
  order_number: string;
  total: number;
  status: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  delivery_city: string;
  delivery_state: string;
  delivery_zip_code: string;
  payment_method: string;
  order_items: OrderItem[];
}

const Orders: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  // Fetch user's orders with order items and try to get product details
  const { 
    data: orders, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      if (!user) return [];

      try {
        // First try to fetch orders with product details
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id, 
            order_number,
            total, 
            status, 
            created_at,
            customer_name,
            customer_email,
            customer_phone,
            delivery_address,
            delivery_city,
            delivery_state,
            delivery_zip_code,
            payment_method,
            order_items (
              id, 
              product_id, 
              quantity, 
              price,
              products (
                title,
                image
              )
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error with product relationship:', error);
          
          // Fallback: fetch orders without product details
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('orders')
            .select(`
              id, 
              order_number,
              total, 
              status, 
              created_at,
              customer_name,
              customer_email,
              customer_phone,
              delivery_address,
              delivery_city,
              delivery_state,
              delivery_zip_code,
              payment_method,
              order_items (
                id, 
                product_id, 
                quantity, 
                price
              )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (fallbackError) throw fallbackError;
          return fallbackData || [];
        }

        return data || [];
      } catch (err) {
        console.error('Query error:', err);
        throw err;
      }
    },
    enabled: !!user
  });

  // Fetch product details separately if needed
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, title, image');
      
      if (error) {
        console.error('Error fetching products:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!orders && orders.length > 0
  });

  // Create a product lookup map
  const productMap = React.useMemo(() => {
    if (!products) return {};
    return products.reduce((acc, product) => {
      acc[product.id] = product;
      return acc;
    }, {} as Record<string, any>);
  }, [products]);

  if (isLoading) {
    return (
      <div className="pt-28 pb-20 section-container flex justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-28 pb-20 section-container flex justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">Unable to load orders</p>
          <p className="text-gray-600 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="pt-28 pb-20 section-container flex flex-col items-center">
        <Package className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Orders Yet</h2>
        <p className="text-gray-600 mb-6">You haven't placed any orders yet. Start shopping to see your orders here.</p>
        <Button onClick={() => navigate('/')} className="bg-blue-600 hover:bg-blue-700">
          Start Shopping
        </Button>
      </div>
    );
  }

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="pt-28 pb-20 bg-gray-50 min-h-screen"
    >
      <div className="section-container">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600">Track and manage your orders</p>
        </div>
        
        <div className="space-y-4">
          {orders.map((order) => {
            const orderDate = new Date(order.created_at);
            const totalItems = order.order_items.reduce(
              (sum, item) => sum + item.quantity, 
              0
            );
            const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const StatusIcon = statusConfig.icon;
            const isExpanded = expandedOrders.has(order.id);

            return (
              <Card key={order.id} className="w-full shadow-sm border-gray-500 hover:shadow-md transition-shadow hover:border-gray-900 hover:bg-gray-300">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg font-semibold">
                          Order #{order.order_number || order.id.slice(0, 8).toUpperCase()}
                        </CardTitle>
                        <Badge className={`${statusConfig.color} border font-medium`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span>Placed on {orderDate.toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}</span>
                        <span>•</span>
                        <span>{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
                        <span>•</span>
                        <span className="font-medium text-gray-900">₹{order.total.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleOrderExpansion(order.id)}
                      className="ml-4 flex items-center gap-1 text-gray-600 hover:text-gray-900"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          Less Details
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          More Details
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                
                {/* Order Items Preview (Always Visible) */}
                <CardContent className="pt-0">
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b">
                      <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-700">
                        <span>Product</span>
                        <span className="text-center">Quantity</span>
                        <span className="text-center">Each Price</span>
                        <span className="text-right">Total Price</span>
                      </div>
                    </div>
                    
                    <div className="divide-y">
                      {order.order_items.map((item) => {
                        const productInfo = item.products || productMap[item.product_id];
                        
                        return (
                          <div key={item.id} className="grid grid-cols-4 gap-4 p-4 hover:bg-gray-100 transition-colors">
                            <div className="flex items-center space-x-3">
                              {productInfo?.image && (
                                <img 
                                  src={productInfo.image} 
                                  alt={productInfo.title}
                                  className="w-12 h-12 object-cover rounded-md border"
                                />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-gray-900 truncate">
                                  {productInfo?.title || `Product ${item.product_id.slice(0, 8)}`}
                                </p>
                                <p className="text-sm text-gray-500">
                                  ID: {item.product_id.slice(0, 8)}...
                                </p>
                              </div>
                            </div>
                            <div className="text-center self-center">
                              <span className="bg-gray-100 px-2 py-1 rounded text-sm font-medium">
                                {item.quantity}
                              </span>
                            </div>
                            <div className="text-center self-center font-medium">
                              ₹{item.price.toFixed(2)}
                            </div>
                            <div className="text-right self-center font-semibold">
                              ₹{(item.quantity * item.price).toFixed(2)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-6 pt-6 border-t border-gray-200"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Customer Information */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            Customer Information
                          </h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Name:</span>
                              <span className="font-medium">{order.customer_name || 'Not provided'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Email:</span>
                              <span className="font-medium">{order.customer_email || 'Not provided'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Phone:</span>
                              <span className="font-medium">{order.customer_phone || 'Not provided'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Payment:</span>
                              <span className="font-medium">
                                {PAYMENT_METHODS[order.payment_method] || order.payment_method || 'Not specified'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Delivery Information */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            Delivery Address
                          </h3>
                          <div className="text-sm">
                            {order.delivery_address || order.delivery_city || order.delivery_state ? (
                              <div className="space-y-1">
                                {order.delivery_address && (
                                  <p className="font-medium">{order.delivery_address}</p>
                                )}
                                {(order.delivery_city || order.delivery_state || order.delivery_zip_code) && (
                                  <p className="text-gray-600">
                                    {[order.delivery_city, order.delivery_state, order.delivery_zip_code]
                                      .filter(Boolean)
                                      .join(', ')}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-gray-500 italic">No delivery address provided</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                 
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </motion.main>
  );
};

export default Orders;
