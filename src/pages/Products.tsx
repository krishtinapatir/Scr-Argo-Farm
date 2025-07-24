import ProductCard from '@/components/ProductCard';
import SearchBar from '@/components/SearchBar';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import sahiwal from "../../public/sahiwal.png";
import { supabase } from '../integrations/supabase/client';

// Updated Product interface to match Admin component exactly
interface Product {
  id: string;
  title: string;
  image: string;
  price: number | string; // Allow both number and string to handle parsing
  unit: string;
  description: string;
  full_description?: string;
  ingredients?: string;
  usage_instructions?: string;
  stock_quantity: number;
  min_stock_level: number;
  max_stock_level: number;
  created_at?: string;
  updated_at?: string;
}

const Products = () => {
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  // Fetch products from Supabase with stock information - updated to match Admin query
  const { data: products, isLoading, error } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, stock_quantity, min_stock_level, max_stock_level')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Ensure all required fields are present with defaults
      return (data || []).map(product => ({
        ...product,
        stock_quantity: product.stock_quantity ?? 0,
        min_stock_level: product.min_stock_level ?? 10,
        max_stock_level: product.max_stock_level ?? 100,
        full_description: product.full_description || '',
        ingredients: product.ingredients || '',
        usage_instructions: product.usage_instructions || ''
      })) as Product[];
    },
  });

  // Update filtered products when products change
  useEffect(() => {
    if (products) {
      setFilteredProducts(products);
    }
  }, [products]);

  const handleSearch = (query: string) => {
    if (!products) return;
    
    if (query.trim() === '') {
      setFilteredProducts(products);
      return;
    }

    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    
    const filtered = products.filter(product => {
      const titleMatch = searchTerms.some(term => 
        product.title.toLowerCase().includes(term)
      );
      const descMatch = searchTerms.some(term => 
        product.description.toLowerCase().includes(term)
      );
      return titleMatch || descMatch;
    });
    
    setFilteredProducts(filtered);
  };

  // Helper function to determine stock status - matches Admin component logic
  const getStockStatus = (product: Product): 'OUT_OF_STOCK' | 'LOW_STOCK' | 'IN_STOCK' => {
    if (product.stock_quantity === 0) {
      return 'OUT_OF_STOCK';
    } else if (product.stock_quantity <= product.min_stock_level) {
      return 'LOW_STOCK';
    } else {
      return 'IN_STOCK';
    }
  };

  // Helper function to get stock status display
  const getStockStatusDisplay = (status: string) => {
    switch (status) {
      case 'OUT_OF_STOCK':
        return { label: 'Out of Stock', color: 'text-red-600 bg-red-50' };
      case 'LOW_STOCK':
        return { label: 'Low Stock', color: 'text-yellow-600 bg-yellow-50' };
      case 'IN_STOCK':
        return { label: 'In Stock', color: 'text-green-600 bg-green-50' };
      default:
        return { label: 'Unknown', color: 'text-gray-600 bg-gray-50' };
    }
  };

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="pt-20 pb-20"
    >
      {/* Search and Products Section */}
      <section className="py-6 bg-brand-blue/10">
        <div className="section-container py-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-4 text-center">
              Our Premium Products
            </h1>
            <SearchBar onSearch={handleSearch} />
          </div>
        
          {/* Product Grid - Moved inside the same section */}
          <div className="mt-8">
            {isLoading ? (
              <div className="text-center py-8">
                <h3 className="text-xl text-gray-600">Loading products...</h3>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <h3 className="text-xl text-gray-600">Error loading products. Please try again.</h3>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8">
                <h3 className="text-xl text-gray-600">No products found. Try a different search term.</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product);
                  const stockDisplay = getStockStatusDisplay(stockStatus);
                  
                  return (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      title={product.title}
                      image={product.image}
                      price={typeof product.price === "number" ? product.price.toString() : product.price.toString()}
                      unit={product.unit}
                      description={product.description}
                      stockQuantity={product.stock_quantity}
                      stockStatus={stockStatus}
                      // Add additional stock info for better display
                      minStockLevel={product.min_stock_level}
                      maxStockLevel={product.max_stock_level}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stock Summary Section - Updated to match Admin logic */}
      <section className="py-8 bg-gray-50">
        <div className="section-container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                <div>
                  <h3 className="font-semibold text-green-700">In Stock</h3>
                  <p className="text-2xl font-bold text-green-800">
                    {products?.filter(p => p.stock_quantity > p.min_stock_level).length || 0}
                  </p>
                  <p className="text-sm text-gray-600">
                    Products available
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-500 rounded-full mr-3"></div>
                <div>
                  <h3 className="font-semibold text-yellow-700">Low Stock</h3>
                  <p className="text-2xl font-bold text-yellow-800">
                    {products?.filter(p => p.stock_quantity > 0 && p.stock_quantity <= p.min_stock_level).length || 0}
                  </p>
                  <p className="text-sm text-gray-600">
                    Products running low
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-500 rounded-full mr-3"></div>
                <div>
                  <h3 className="font-semibold text-red-700">Out of Stock</h3>
                  <p className="text-2xl font-bold text-red-800">
                    {products?.filter(p => p.stock_quantity === 0).length || 0}
                  </p>
                  <p className="text-sm text-gray-600">
                    Products unavailable
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Stock Alert for customers */}
          {products && products.some(p => p.stock_quantity <= p.min_stock_level) && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Limited Stock Alert
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>Some products are running low on stock. Order now to avoid disappointment!</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Product Benefits */}
      <section className="py-16 bg-brand-cream">
        <div className="section-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-display font-bold mb-6">
                Why Choose Our A2 Products?
              </h2>
              <div className="space-y-4">
                <div className="glass-panel p-4">
                  <h3 className="font-semibold mb-1">Immunity Booster</h3>
                  <p className="text-sm">Strengthens your immune system with its natural nutrients.</p>
                </div>
                <div className="glass-panel p-4">
                  <h3 className="font-semibold mb-1">Bone Strengthener</h3>
                  <p className="text-sm">Rich in calcium that supports strong bones and teeth development.</p>
                </div>
                <div className="glass-panel p-4">
                  <h3 className="font-semibold mb-1">Heart-Healthy</h3>
                  <p className="text-sm">Good for cardiovascular health and helps maintain cholesterol.</p>
                </div>
                <div className="glass-panel p-4">
                  <h3 className="font-semibold mb-1">Deeply Nourishing</h3>
                  <p className="text-sm">Provides essential nutrients for overall wellbeing.</p>
                </div>
                <div className="glass-panel p-4">
                  <h3 className="font-semibold mb-1">Easier to Digest</h3>
                  <p className="text-sm">A2 proteins are gentler on the digestive system.</p>
                </div>
                <div className="glass-panel p-4">
                  <h3 className="font-semibold mb-1">Rich in Nutrients</h3>
                  <p className="text-sm">Packed with essential vitamins and minerals.</p>
                </div>
              </div>
            </div>
            <div>
              <div className="aspect-w-4 aspect-h-3 rounded-2xl overflow-hidden">
                <img 
                  src={sahiwal}
                  alt="A2 Sahiwal Cows" 
                  className="object-cover w-full h-full"
                />
              </div>
              <p className="mt-4 text-sm text-center italic">
                Our Sahiwal cows are raised with love and care in a natural environment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Ordering Info */}
      <section className="py-16">
        <div className="section-container">
          <div className="glass-panel p-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-display font-semibold mb-6 text-center">
              How to Order
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-brand-red text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <span className="font-bold">1</span>
                </div>
                <h3 className="font-medium mb-2">Call Us</h3>
                <p className="text-sm">
                  Call Mrs. Sarika Reddy at +91 9868220018 or S. Chandrasheker Reddy at +91 9701039748.
                </p>
              </div>
              <div className="text-center">
                <div className="bg-brand-red text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <span className="font-bold">2</span>
                </div>
                <h3 className="font-medium mb-2">Place Your Order</h3>
                <p className="text-sm">
                  Tell us what products you'd like to order and provide your delivery details.
                </p>
              </div>
              <div className="text-center">
                <div className="bg-brand-red text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <span className="font-bold">3</span>
                </div>
                <h3 className="font-medium mb-2">Receive at Home</h3>
                <p className="text-sm">
                  Enjoy home delivery of fresh dairy products right to your doorstep.
                </p>
              </div>
            </div>
            <div className="mt-8 text-center">
              <p className="text-sm mb-2">
                <span className="font-semibold">Note:</span> Orders placed before 4 PM will be delivered the next day.
              </p>
              <p className="text-brand-red font-medium">
                Home Delivery Available!
              </p>
            </div>
          </div>
        </div>
      </section>
    </motion.main>
  );
};

export default Products;
