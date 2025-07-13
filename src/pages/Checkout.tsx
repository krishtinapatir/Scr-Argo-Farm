// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { useAuth } from '@/contexts/AuthContext';
// import { useToast } from '@/hooks/use-toast';
// import { supabase } from '@/integrations/supabase/client';
// import { Tables } from '@/integrations/supabase/types';
// import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
// import { motion } from 'framer-motion';
// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';

// // Razorpay interfaces
// interface RazorpayResponse {
//   razorpay_payment_id?: string;
//   razorpay_order_id?: string;
//   razorpay_signature?: string;
//   error?: {
//     code: string;
//     description: string;
//     source: string;
//     step: string;
//     reason: string;
//   };
// }

// interface RazorpayOptions {
//   key: string;
//   amount: number;
//   currency: string;
//   name: string;
//   description: string;
//   image?: string;
//   prefill: {
//     name: string;
//     contact: string;
//     email: string;
//   };
//   notes: Record<string, string>;
//   theme: {
//     color: string;
//   };
//   handler: (response: RazorpayResponse) => void;
//   modal: {
//     ondismiss: () => void;
//   };
// }

// interface RazorpayInstance {
//   open: () => void;
//   close: () => void;
// }

// interface WindowWithRazorpay extends Window {
//   Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
// }

// const Checkout = () => {
//   const { user } = useAuth();
//   const queryClient = useQueryClient();
//   const navigate = useNavigate();
//   const { toast } = useToast();
  
//   const [formData, setFormData] = useState({
//     name: '',
//     phone: '',
//     address: '',
//     city: '',
//     state: '',
//     zipCode: ''
//   });

//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [paymentProcessing, setPaymentProcessing] = useState(false);
//   const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');

//   // Fetch products
//   const { data: products } = useQuery<Tables<'products'>[]>({
//     queryKey: ['products-for-cart'],
//     queryFn: async () => {
//       const { data, error } = await supabase
//         .from('products')
//         .select('*');
        
//       if (error) throw error;
//       return data as Tables<'products'>[];
//     },
//   });

//   // Fetch cart items
//   const { data: cartItems, isLoading } = useQuery({
//     queryKey: ['cart', user?.id],
//     queryFn: async () => {
//       if (!user) return [];
      
//       const { data, error } = await supabase
//         .from('cart_items')
//         .select('*')
//         .eq('user_id', user.id);
        
//       if (error) throw error;
//       return data || [];
//     },
//     enabled: !!user,
//   });

//   // Find product details for cart items
//   const cartWithProducts = cartItems?.map(item => {
//     const product = products?.find(p => p.id === item.product_id || p.id.toString() === item.product_id);
//     return {
//       ...item,
//       product
//     };
//   }) || [];

//   // Calculate total
//   const total = cartWithProducts.reduce((sum, item) => {
//     return sum + (Number(item.product?.price || 0) * item.quantity);
//   }, 0);

//   // Update form data
//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   // Process order - Fixed to work directly with Supabase
//   const placeOrder = useMutation({
//     mutationFn: async (paymentId?: string) => {
//       if (!user) throw new Error("User not authenticated");

//       // Create order in Supabase orders table
//       const orderData = {
//         user_id: user.id,
//         total: total,
//         status: paymentId ? 'paid' : (paymentMethod === 'cod' ? 'pending' : 'pending'),
//         payment_method: paymentMethod === 'cod' ? 'cod' : 'online',
//         customer_name: formData.name,
//         customer_phone: formData.phone,
//         customer_email: user.email || '',
//         delivery_address: formData.address,
//         delivery_city: formData.city,
//         delivery_state: formData.state,
//         delivery_zip_code: formData.zipCode,
//         payment_id: paymentId || null,
//         payment_order_id: null,
//         payment_signature: null
//       };

//       console.log('Creating order with data:', orderData);

//       const { data: order, error: orderError } = await supabase
//         .from('orders')
//         .insert([orderData])
//         .select()
//         .single();

//       if (orderError) {
//         console.error('Order creation error:', orderError);
//         throw new Error(`Failed to create order: ${orderError.message}`);
//       }

//       if (!order) {
//         throw new Error('No order returned from database');
//       }

//       console.log('Order created successfully:', order);

//       // Create order items
//       const orderItems = cartWithProducts.map(item => ({
//         order_id: order.id,
//         product_id: item.product_id,
//         quantity: item.quantity,
//         price: Number(item.product?.price || 0)
//       }));

//       console.log('Creating order items:', orderItems);

//       const { error: itemsError } = await supabase
//         .from('order_items')
//         .insert(orderItems);

//       if (itemsError) {
//         console.error('Order items creation error:', itemsError);
//         throw new Error(`Failed to create order items: ${itemsError.message}`);
//       }

//       // Clear the cart
//       const { error: clearCartError } = await supabase
//         .from('cart_items')
//         .delete()
//         .eq('user_id', user.id);
        
//       if (clearCartError) {
//         console.error('Cart clearing error:', clearCartError);
//         throw new Error(`Failed to clear cart: ${clearCartError.message}`);
//       }
      
//       return order.id;
//     },
//     onSuccess: (orderId) => {
//       console.log('Order placed successfully with ID:', orderId);
//       queryClient.invalidateQueries({ queryKey: ['cart'] });
//       toast({
//         title: "Order placed successfully",
//         description: paymentMethod === 'cod' 
//           ? "Your COD order has been placed. Please keep the exact amount ready for delivery." 
//           : "Thank you for your order!"
//       });
//       navigate('/');
//     },
//     onError: (error) => {
//       console.error("Error placing order:", error);
//       toast({
//         title: "Error processing order",
//         description: error instanceof Error ? error.message : "There was a problem placing your order. Please try again.",
//         variant: "destructive"
//       });
//     }
//   });

//   // Initialize Razorpay payment
//   const initializeRazorpayPayment = () => {
//     setPaymentProcessing(true);
    
//     const options: RazorpayOptions = {
//       key: 'rzp_live_OtMj4vjVpeRjg8', // Replace with your Razorpay key ID
//       amount: total * 100, // Razorpay expects amount in paise (1 INR = 100 paise)
//       currency: 'INR',
//       name: 'SCR Farms',
//       description: 'Purchase from SCR Farms',
//       image: '/logo.png', // Your company logo
//       prefill: {
//         name: formData.name,
//         contact: formData.phone,
//         email: user?.email || ''
//       },
//       notes: {
//         address: formData.address
//       },
//       theme: {
//         color: '#E53935' // Match with your brand color
//       },
//       handler: function(response: RazorpayResponse) {
//         // Handle successful payment
//         if (response.razorpay_payment_id) {
//           handlePaymentSuccess(response.razorpay_payment_id);
//         } else {
//           handlePaymentFailure('No payment ID received');
//         }
//       },
//       modal: {
//         ondismiss: function() {
//           setPaymentProcessing(false);
//           toast({
//             title: "Payment cancelled",
//             description: "You have cancelled the payment process.",
//             variant: "destructive"
//           });
//         }
//       }
//     };

//     const rzp = new (window as unknown as WindowWithRazorpay).Razorpay(options);
//     rzp.open();
//   };

//   // Handle successful payment
//   const handlePaymentSuccess = async (paymentId: string) => {
//     try {
//       await placeOrder.mutateAsync(paymentId);
//       setPaymentProcessing(false);
//     } catch (error) {
//       setPaymentProcessing(false);
//       console.error("Error processing order after payment:", error);
//     }
//   };

//   // Handle payment failure
//   const handlePaymentFailure = (error: string | Error) => {
//     setPaymentProcessing(false);
//     toast({
//       title: "Payment failed",
//       description: "There was a problem processing your payment. Please try again.",
//       variant: "destructive"
//     });
//     console.error("Payment failed:", error);
//   };

//   // Handle COD order placement
//   const handleCODOrder = async () => {
//     try {
//       setIsSubmitting(true);
//       console.log('Placing COD order...');
//       await placeOrder.mutateAsync(undefined);
//     } catch (error) {
//       console.error("Error placing COD order:", error);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsSubmitting(true);
    
//     // Validate form
//     const { name, phone, address, city, state, zipCode } = formData;
//     if (!name || !phone || !address || !city || !state || !zipCode) {
//       toast({
//         title: "Missing information",
//         description: "Please fill in all the required fields",
//         variant: "destructive"
//       });
//       setIsSubmitting(false);
//       return;
//     }

//     // Validate cart is not empty
//     if (cartWithProducts.length === 0) {
//       toast({
//         title: "Cart is empty",
//         description: "Please add items to your cart before placing an order",
//         variant: "destructive"
//       });
//       setIsSubmitting(false);
//       return;
//     }

//     // Handle COD order
//     if (paymentMethod === 'cod') {
//       await handleCODOrder();
//       return;
//     }
    
//     // Handle online payment
//     if (!(window as unknown as WindowWithRazorpay).Razorpay) {
//       const script = document.createElement('script');
//       script.src = 'https://checkout.razorpay.com/v1/checkout.js';
//       script.async = true;
//       script.onload = () => {
//         initializeRazorpayPayment();
//       };
//       script.onerror = () => {
//         toast({
//           title: "Payment gateway error",
//           description: "Failed to load payment gateway. Please try again later.",
//           variant: "destructive"
//         });
//         setIsSubmitting(false);
//       };
//       document.body.appendChild(script);
//     } else {
//       initializeRazorpayPayment();
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="pt-28 pb-20 section-container flex justify-center">
//         <p>Loading checkout...</p>
//       </div>
//     );
//   }

//   if (cartWithProducts.length === 0) {
//     navigate('/cart');
//     return null;
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
//         <h1 className="text-3xl font-display font-bold mb-8">Checkout</h1>
        
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//           <div className="lg:col-span-2">
//             <div className="glass-panel p-6 mb-8">
//               <h2 className="text-xl font-semibold mb-4">Delivery Information</h2>
              
//               <form onSubmit={handleSubmit} className="space-y-4">
//                 <div>
//                   <label htmlFor="name" className="block text-sm font-medium mb-1">Full Name</label>
//                   <Input
//                     id="name"
//                     name="name"
//                     value={formData.name}
//                     onChange={handleChange}
//                     placeholder="Enter your full name"
//                     required
//                   />
//                 </div>
                
//                 <div>
//                   <label htmlFor="phone" className="block text-sm font-medium mb-1">Phone Number</label>
//                   <Input
//                     id="phone"
//                     name="phone"
//                     value={formData.phone}
//                     onChange={handleChange}
//                     placeholder="Enter your phone number"
//                     required
//                   />
//                 </div>
                
//                 <div>
//                   <label htmlFor="address" className="block text-sm font-medium mb-1">Address</label>
//                   <Input
//                     id="address"
//                     name="address"
//                     value={formData.address}
//                     onChange={handleChange}
//                     placeholder="Enter your address"
//                     required
//                   />
//                 </div>
                
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <label htmlFor="city" className="block text-sm font-medium mb-1">City</label>
//                     <Input
//                       id="city"
//                       name="city"
//                       value={formData.city}
//                       onChange={handleChange}
//                       placeholder="Enter your city"
//                       required
//                     />
//                   </div>
                  
//                   <div>
//                     <label htmlFor="state" className="block text-sm font-medium mb-1">State</label>
//                     <Input
//                       id="state"
//                       name="state"
//                       value={formData.state}
//                       onChange={handleChange}
//                       placeholder="Enter your state"
//                       required
//                     />
//                   </div>
//                 </div>
                
//                 <div>
//                   <label htmlFor="zipCode" className="block text-sm font-medium mb-1">ZIP Code</label>
//                   <Input
//                     id="zipCode"
//                     name="zipCode"
//                     value={formData.zipCode}
//                     onChange={handleChange}
//                     placeholder="Enter your ZIP code"
//                     required
//                   />
//                 </div>

//                 {/* Payment Method Selection */}
//                 <div className="mt-6">
//                   <label className="block text-sm font-medium mb-3">Payment Method</label>
//                   <div className="space-y-3">
//                     <div className="flex items-center space-x-3">
//                       <input
//                         type="radio"
//                         id="online"
//                         name="paymentMethod"
//                         value="online"
//                         checked={paymentMethod === 'online'}
//                         onChange={(e) => setPaymentMethod(e.target.value as 'online' | 'cod')}
//                         className="w-4 h-4 text-brand-red border-gray-300 focus:ring-brand-red"
//                       />
//                       <label htmlFor="online" className="text-sm font-medium">
//                         Online Payment (Credit/Debit Card, UPI, Net Banking)
//                       </label>
//                     </div>
                    
//                     <div className="flex items-center space-x-3">
//                       <input
//                         type="radio"
//                         id="cod"
//                         name="paymentMethod"
//                         value="cod"
//                         checked={paymentMethod === 'cod'}
//                         onChange={(e) => setPaymentMethod(e.target.value as 'online' | 'cod')}
//                         className="w-4 h-4 text-brand-red border-gray-300 focus:ring-brand-red"
//                       />
//                       <label htmlFor="cod" className="text-sm font-medium">
//                         Cash on Delivery (COD)
//                       </label>
//                     </div>
//                   </div>

//                   {paymentMethod === 'cod' && (
//                     <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
//                       <p className="text-sm text-yellow-800">
//                         <strong>Note:</strong> Please keep the exact amount ready (₹{total.toFixed(2)}) for cash payment during delivery.
//                       </p>
//                     </div>
//                   )}
//                 </div>
                
//                 <Button
//                   type="submit"
//                   className="w-full bg-brand-red hover:bg-brand-red/90 mt-6"
//                   disabled={isSubmitting || paymentProcessing}
//                 >
//                   {isSubmitting || paymentProcessing 
//                     ? 'Processing...' 
//                     : paymentMethod === 'cod' 
//                       ? 'Place COD Order' 
//                       : 'Proceed to Payment'
//                   }
//                 </Button>
//               </form>
//             </div>
//           </div>
          
//           <div className="lg:col-span-1">
//             <div className="glass-panel p-6 sticky top-24">
//               <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              
//               <div className="space-y-4 mb-6">
//                 {cartWithProducts.map((item) => (
//                   <div key={item.id} className="flex justify-between">
//                     <div>
//                       <span className="font-medium">{item.product?.title}</span>
//                       <span className="text-gray-500 block text-sm">
//                         {item.quantity} x ₹{item.product?.price}
//                       </span>
//                     </div>
//                     <span className="font-medium">
//                       ₹{(Number(item.product?.price || 0) * item.quantity).toFixed(2)}
//                     </span>
//                   </div>
//                 ))}
//               </div>
              
//               <div className="border-t pt-4 space-y-2 mb-4">
//                 <div className="flex justify-between">
//                   <span>Subtotal</span>
//                   <span>₹{total.toFixed(2)}</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span>Shipping</span>
//                   <span>₹0.00</span>
//                 </div>
//                 {paymentMethod === 'cod' && (
//                   <div className="flex justify-between text-sm text-gray-600">
//                     <span>COD Charges</span>
//                     <span>₹0.00</span>
//                   </div>
//                 )}
//               </div>
              
//               <div className="border-t pt-4 mb-6">
//                 <div className="flex justify-between font-bold">
//                   <span>Total</span>
//                   <span>₹{total.toFixed(2)}</span>
//                 </div>
//               </div>
              
//               <div className="text-sm text-gray-600">
//                 <p>Payment Method: {paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Online Payment (Razorpay)'}</p>
//                 <p className="mt-2">Estimated Delivery: 1-2 business days</p>
//                 {paymentMethod === 'cod' && (
//                   <p className="mt-2 text-yellow-700 font-medium">
//                     Please keep exact change ready: ₹{total.toFixed(2)}
//                   </p>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </motion.main>
//   );
// };

// export default Checkout;
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Razorpay interfaces
interface RazorpayResponse {
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
  error?: {
    code: string;
    description: string;
    source: string;
    step: string;
    reason: string;
  };
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  prefill: {
    name: string;
    contact: string;
    email: string;
  };
  notes: Record<string, string>;
  theme: {
    color: string;
  };
  handler: (response: RazorpayResponse) => void;
  modal: {
    ondismiss: () => void;
  };
}

interface RazorpayInstance {
  open: () => void;
  close: () => void;
}

interface WindowWithRazorpay extends Window {
  Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
}

const Checkout = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');

  // Fetch user profile
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) {
        console.log('Profile fetch error:', error);
        return null;
      }
      return data;
    },
    enabled: !!user,
  });

  // Auto-fill form with profile data when profile loads
  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.full_name || '',
        phone: userProfile.phone || '',
        address: userProfile.address || '',
        city: userProfile.city || '',
        state: userProfile.state || '',
        zipCode: userProfile.zip_code || ''
      });
    }
  }, [userProfile]);

  // Fetch products
  const { data: products } = useQuery<Tables<'products'>[]>({
    queryKey: ['products-for-cart'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*');
        
      if (error) throw error;
      return data as Tables<'products'>[];
    },
  });

  // Fetch cart items
  const { data: cartItems, isLoading } = useQuery({
    queryKey: ['cart', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id);
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Find product details for cart items
  const cartWithProducts = cartItems?.map(item => {
    const product = products?.find(p => p.id === item.product_id || p.id.toString() === item.product_id);
    return {
      ...item,
      product
    };
  }) || [];

  // Calculate total
  const total = cartWithProducts.reduce((sum, item) => {
    return sum + (Number(item.product?.price || 0) * item.quantity);
  }, 0);

  // Update form data
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Update user profile mutation
  const updateProfile = useMutation({
    mutationFn: async (profileData: any) => {
      if (!user) return;
      
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: profileData.name,
          phone: profileData.phone,
          address: profileData.address,
          city: profileData.city,
          state: profileData.state,
          zip_code: profileData.zipCode,
          updated_at: new Date().toISOString()
        });
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: (error) => {
      console.error('Profile update error:', error);
      // Don't show error toast for profile update as it's secondary
    }
  });

  // Process order - Fixed to work directly with Supabase
  const placeOrder = useMutation({
    mutationFn: async (paymentId?: string) => {
      if (!user) throw new Error("User not authenticated");

      // Update user profile with current form data
      try {
        await updateProfile.mutateAsync(formData);
      } catch (error) {
        console.log('Profile update failed, but continuing with order:', error);
      }

      // Create order in Supabase orders table
      const orderData = {
        user_id: user.id,
        total: total,
        status: paymentId ? 'paid' : (paymentMethod === 'cod' ? 'pending' : 'pending'),
        payment_method: paymentMethod === 'cod' ? 'cod' : 'online',
        customer_name: formData.name,
        customer_phone: formData.phone,
        customer_email: user.email || '',
        delivery_address: formData.address,
        delivery_city: formData.city,
        delivery_state: formData.state,
        delivery_zip_code: formData.zipCode,
        payment_id: paymentId || null,
        payment_order_id: null,
        payment_signature: null
      };

      console.log('Creating order with data:', orderData);

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (orderError) {
        console.error('Order creation error:', orderError);
        throw new Error(`Failed to create order: ${orderError.message}`);
      }

      if (!order) {
        throw new Error('No order returned from database');
      }

      console.log('Order created successfully:', order);

      // Create order items
      const orderItems = cartWithProducts.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: Number(item.product?.price || 0)
      }));

      console.log('Creating order items:', orderItems);

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Order items creation error:', itemsError);
        throw new Error(`Failed to create order items: ${itemsError.message}`);
      }

      // Clear the cart
      const { error: clearCartError } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);
        
      if (clearCartError) {
        console.error('Cart clearing error:', clearCartError);
        throw new Error(`Failed to clear cart: ${clearCartError.message}`);
      }
      
      return order.id;
    },
    onSuccess: (orderId) => {
      console.log('Order placed successfully with ID:', orderId);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast({
        title: "Order placed successfully",
        description: paymentMethod === 'cod' 
          ? "Your COD order has been placed. Please keep the exact amount ready for delivery." 
          : "Thank you for your order!"
      });
      navigate('/');
    },
    onError: (error) => {
      console.error("Error placing order:", error);
      toast({
        title: "Error processing order",
        description: error instanceof Error ? error.message : "There was a problem placing your order. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Initialize Razorpay payment
  const initializeRazorpayPayment = () => {
    setPaymentProcessing(true);
    
    const options: RazorpayOptions = {
      key: 'rzp_live_OtMj4vjVpeRjg8', // Replace with your Razorpay key ID
      amount: total * 100, // Razorpay expects amount in paise (1 INR = 100 paise)
      currency: 'INR',
      name: 'SCR Farms',
      description: 'Purchase from SCR Farms',
      image: '/logo.png', // Your company logo
      prefill: {
        name: formData.name,
        contact: formData.phone,
        email: user?.email || ''
      },
      notes: {
        address: formData.address
      },
      theme: {
        color: '#E53935' // Match with your brand color
      },
      handler: function(response: RazorpayResponse) {
        // Handle successful payment
        if (response.razorpay_payment_id) {
          handlePaymentSuccess(response.razorpay_payment_id);
        } else {
          handlePaymentFailure('No payment ID received');
        }
      },
      modal: {
        ondismiss: function() {
          setPaymentProcessing(false);
          toast({
            title: "Payment cancelled",
            description: "You have cancelled the payment process.",
            variant: "destructive"
          });
        }
      }
    };

    const rzp = new (window as unknown as WindowWithRazorpay).Razorpay(options);
    rzp.open();
  };

  // Handle successful payment
  const handlePaymentSuccess = async (paymentId: string) => {
    try {
      await placeOrder.mutateAsync(paymentId);
      setPaymentProcessing(false);
    } catch (error) {
      setPaymentProcessing(false);
      console.error("Error processing order after payment:", error);
    }
  };

  // Handle payment failure
  const handlePaymentFailure = (error: string | Error) => {
    setPaymentProcessing(false);
    toast({
      title: "Payment failed",
      description: "There was a problem processing your payment. Please try again.",
      variant: "destructive"
    });
    console.error("Payment failed:", error);
  };

  // Handle COD order placement
  const handleCODOrder = async () => {
    try {
      setIsSubmitting(true);
      console.log('Placing COD order...');
      await placeOrder.mutateAsync(undefined);
    } catch (error) {
      console.error("Error placing COD order:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Validate form
    const { name, phone, address, city, state, zipCode } = formData;
    if (!name || !phone || !address || !city || !state || !zipCode) {
      toast({
        title: "Missing information",
        description: "Please fill in all the required fields",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }

    // Validate cart is not empty
    if (cartWithProducts.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart before placing an order",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }

    // Handle COD order
    if (paymentMethod === 'cod') {
      await handleCODOrder();
      return;
    }
    
    // Handle online payment
    if (!(window as unknown as WindowWithRazorpay).Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        initializeRazorpayPayment();
      };
      script.onerror = () => {
        toast({
          title: "Payment gateway error",
          description: "Failed to load payment gateway. Please try again later.",
          variant: "destructive"
        });
        setIsSubmitting(false);
      };
      document.body.appendChild(script);
    } else {
      initializeRazorpayPayment();
    }
  };

  if (isLoading) {
    return (
      <div className="pt-28 pb-20 section-container flex justify-center">
        <p>Loading checkout...</p>
      </div>
    );
  }

  if (cartWithProducts.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="pt-28 pb-20"
    >
      <div className="section-container">
        <h1 className="text-3xl font-display font-bold mb-8">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="glass-panel p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Delivery Information</h2>
              
              {userProfile && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">
                    <strong>Info:</strong> Your delivery details have been auto-filled from your profile. You can modify them if needed.
                  </p>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-1">Full Name</label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium mb-1">Phone Number</label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="address" className="block text-sm font-medium mb-1">Address</label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter your address"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium mb-1">City</label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Enter your city"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="state" className="block text-sm font-medium mb-1">State</label>
                    <Input
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="Enter your state"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="zipCode" className="block text-sm font-medium mb-1">ZIP Code</label>
                  <Input
                    id="zipCode"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    placeholder="Enter your ZIP code"
                    required
                  />
                </div>

                {/* Payment Method Selection */}
                <div className="mt-6">
                  <label className="block text-sm font-medium mb-3">Payment Method</label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id="online"
                        name="paymentMethod"
                        value="online"
                        checked={paymentMethod === 'online'}
                        onChange={(e) => setPaymentMethod(e.target.value as 'online' | 'cod')}
                        className="w-4 h-4 text-brand-red border-gray-300 focus:ring-brand-red"
                      />
                      <label htmlFor="online" className="text-sm font-medium">
                        Online Payment (Credit/Debit Card, UPI, Net Banking)
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id="cod"
                        name="paymentMethod"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={(e) => setPaymentMethod(e.target.value as 'online' | 'cod')}
                        className="w-4 h-4 text-brand-red border-gray-300 focus:ring-brand-red"
                      />
                      <label htmlFor="cod" className="text-sm font-medium">
                        Cash on Delivery (COD)
                      </label>
                    </div>
                  </div>

                  {paymentMethod === 'cod' && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> Please keep the exact amount ready (₹{total.toFixed(2)}) for cash payment during delivery.
                      </p>
                    </div>
                  )}
                </div>
                
                <Button
                  type="submit"
                  className="w-full bg-brand-red hover:bg-brand-red/90 mt-6"
                  disabled={isSubmitting || paymentProcessing}
                >
                  {isSubmitting || paymentProcessing 
                    ? 'Processing...' 
                    : paymentMethod === 'cod' 
                      ? 'Place COD Order' 
                      : 'Proceed to Payment'
                  }
                </Button>
              </form>
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <div className="glass-panel p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                {cartWithProducts.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <div>
                      <span className="font-medium">{item.product?.title}</span>
                      <span className="text-gray-500 block text-sm">
                        {item.quantity} x ₹{item.product?.price}
                      </span>
                    </div>
                    <span className="font-medium">
                      ₹{(Number(item.product?.price || 0) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4 space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>₹0.00</span>
                </div>
                {paymentMethod === 'cod' && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>COD Charges</span>
                    <span>₹0.00</span>
                  </div>
                )}
              </div>
              
              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                <p>Payment Method: {paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Online Payment (Razorpay)'}</p>
                <p className="mt-2">Estimated Delivery: 1-2 business days</p>
                {paymentMethod === 'cod' && (
                  <p className="mt-2 text-yellow-700 font-medium">
                    Please keep exact change ready: ₹{total.toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.main>
  );
};

export default Checkout;