import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/products';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertTriangle, Package, Pencil, Plus, SaveIcon, Trash2, X, Minus, Search } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface ProductWithStock extends Product {
  stock_quantity: number;
  min_stock_level: number;
  max_stock_level: number;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

const ProductsTab: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingProduct, setEditingProduct] = useState<ProductWithStock | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [stockUpdateProduct, setStockUpdateProduct] = useState<ProductWithStock | null>(null);
  const [stockUpdateQuantity, setStockUpdateQuantity] = useState<number>(0);
  const [newProduct, setNewProduct] = useState<Partial<ProductWithStock>>({
    title: '', image: '', price: '', unit: '', description: '', full_description: '', 
    ingredients: '', usage_instructions: '', stock_quantity: 0, min_stock_level: 10, max_stock_level: 100
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMobileTab, setActiveMobileTab] = useState<'overview' | 'manage'>('manage');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

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

  // Filter products based on search term
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    
    return products.filter(product => 
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [products, searchTerm]);

  // Get low stock products
  const lowStockProducts = products.filter(product =>
    product.stock_status === 'low_stock' || product.stock_status === 'out_of_stock'
  );

  // Create product mutation
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
        description: product.description, full_description: product.full_description, 
        ingredients: product.ingredients, usage_instructions: product.usage_instructions, 
        stock_quantity: product.stock_quantity, min_stock_level: product.min_stock_level, 
        max_stock_level: product.max_stock_level, updated_at: new Date().toISOString()
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

  // Handler functions
  const handleDeleteClick = (id: string) => {
    setProductToDelete(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (productToDelete) {
      deleteProduct.mutate(productToDelete);
      setConfirmOpen(false);
      setProductToDelete(null);
    }
  };

  const handleStockUpdate = (product: ProductWithStock) => {
    setStockUpdateProduct(product);
    setStockUpdateQuantity(0);
  };

  const handleStockSave = (operation: 'add' | 'subtract' | 'set' | 'add10', productArg?: ProductWithStock) => {
    const productToUpdate = productArg || stockUpdateProduct;
    if (!productToUpdate) return;

    let quantity = stockUpdateQuantity;
    let op = operation;
    if (operation === 'add10') {
      quantity = 10;
      op = 'add';
    }

    updateStock.mutate({
      productId: productToUpdate.id,
      newQuantity: quantity,
      operation: op as 'add' | 'subtract' | 'set'
    }, {
      onSuccess: () => {
        setStockUpdateProduct(null);
        setStockUpdateQuantity(0);
      }
    });
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'out_of_stock': return 'bg-red-100 text-red-800';
      case 'low_stock': return 'bg-yellow-100 text-yellow-800';
      case 'in_stock': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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

  const handleCancelEdit = () => {
    setEditingProduct(null);
  };

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
        setNewProduct({ 
          title: '', image: '', price: '', unit: '', description: '', full_description: '', 
          ingredients: '', usage_instructions: '', stock_quantity: 0, min_stock_level: 10, max_stock_level: 100 
        });
      }
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-base md:text-xl lg:text-2xl font-semibold text-gray-800">Products & Stock Management</h2>
        {!isAddingNew && (
          <Button 
            onClick={() => {
              setIsAddingNew(true);
              setEditingProduct(null);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm hidden md:flex"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Product
          </Button>
        )}
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search products by name, unit, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {searchTerm && (
          <div className="mt-2 text-sm text-gray-600">
            {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
          </div>
        )}
      </div>

      {/* Mobile-only sub-tabs */}
      <div className="mb-6 md:hidden">
        <div className="flex justify-between bg-gray-100 p-1 rounded-md shadow-sm">
          <button
            onClick={() => setActiveMobileTab('overview')}
            className={`flex-1 text-xs md:text-sm font-medium py-2 px-2 whitespace-nowrap rounded-l-lg transition-all duration-200
              ${activeMobileTab === 'overview'
                ? 'bg-teal-500 shadow-md'
                : 'text-black bg-teal-100 hover:bg-blue-200'
              }`}
          >
            Stock Overview
          </button>
          <button
            onClick={() => setActiveMobileTab('manage')}
            className={`flex-1 text-xs md:text-sm font-medium py-2 px-2 whitespace-nowrap rounded-r-lg transition-all duration-200
              ${activeMobileTab === 'manage'
                ? 'bg-teal-500 shadow-md'
                : 'text-black bg-teal-100 hover:bg-blue-100'
              }`}
          >
            Manage Products
          </button>
        </div>
      </div>

      {/* Mobile Add Product Button */}
      {!isAddingNew && (
        <div className="mb-4 md:hidden">
          {activeMobileTab === 'manage' && (
            <Button 
              onClick={() => {
                setActiveMobileTab('manage');
                setIsAddingNew(true);
                setEditingProduct(null);
              }}
              className="w-full bg-indigo-400 border border-indigo-500 hover:bg-blue-700 text-black shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Product
            </Button>
          )}
        </div>
      )}

      {/* Stock Alerts Section */}
      <div className={`${activeMobileTab === 'overview' ? 'block' : 'hidden'} md:block`}>
        {lowStockProducts.length > 0 && (
          <div className="mb-6 p-3 md:p-4 bg-gradient-to-r from-yellow-100 to-orange-200 border border-black rounded-lg shadow-sm">
            <h3 className="text-base md:text-lg font-semibold mb-2 md:mb-3 flex items-center text-yellow-800">
              <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 mr-2 text-yellow-600" />
              <span className="text-sm md:text-base">Stock Alerts ({lowStockProducts.length} items)</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
              {lowStockProducts.map(product => (
                <div key={product.id} className="flex justify-between items-center p-2 md:p-3 bg-white rounded-lg shadow-sm border border-yellow-700">
                  <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-8 h-8 md:w-10 md:h-10 object-cover rounded-md flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-gray-900 text-xs md:text-sm block truncate">{product.title}</span>
                      <div className="flex items-center gap-1 md:gap-2 mt-0.5 md:mt-1">
                        <span className="text-xs text-gray-600">{product.unit}</span>
                        <span className={`px-1.5 md:px-2 py-0.5 md:py-1 rounded-full text-xs font-medium ${getStockStatusColor(product.stock_status)}`}>
                                                  quantity {product.stock_quantity}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleStockUpdate(product)}
                    className="text-xs bg-blue-500 hover:bg-blue-600 text-white border border-black rounded-lg p-1.5 md:p-2 shadow-sm flex-shrink-0 ml-2"
                  >
                    <Package className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="ml-1 text-[10px] md:text-xs">Restock</span>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Products Table/Cards */}
      <div className={`${activeMobileTab === 'manage' ? 'block' : 'hidden'} md:block`}>
        {/* Add New Product Form */}
        {isAddingNew && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 md:p-6 border border-gray-900 rounded-lg bg-gray-300"
          >
            <h3 className="text-lg font-medium mb-4 text-gray-800">Add New Product</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 border-b border-gray-900 pb-4">
              <div>
                <label htmlFor="new-title" className="block text-sm font-medium mb-1 text-gray-700">Title *</label>
                <Input
                  id="new-title"
                  name="title"
                  value={newProduct.title ?? ''}
                  onChange={handleNewProductChange}
                  placeholder="Product title"
                  className="focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="new-image" className="block text-sm font-medium mb-1 text-gray-700">Image URL</label>
                <Input
                  id="new-image"
                  name="image"
                  value={newProduct.image ?? ''}
                  onChange={handleNewProductChange}
                  placeholder="https://example.com/image.jpg"
                  className="focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="new-price" className="block text-sm font-medium mb-1 text-black">Price (₹) *</label>
                <Input
                  id="new-price"
                  name="price"
                  value={newProduct.price ?? ''}
                  onChange={handleNewProductChange}
                  placeholder="100"
                  className="focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="new-unit" className="block text-sm font-medium mb-1 text-gray-700">Unit *</label>
                <Input
                  id="new-unit"
                  name="unit"
                  value={newProduct.unit ?? ''}
                  onChange={handleNewProductChange}
                  placeholder="1 L, 500g, etc."
                  className="focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Stock Management Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div>
                <label htmlFor="new-stock-quantity" className="block text-sm font-medium mb-1 text-blue-800">Initial Stock Quantity</label>
                <Input
                  id="new-stock-quantity"
                  name="stock_quantity"
                  type="number"
                  min="0"
                  value={newProduct.stock_quantity ?? 0}
                  onChange={handleNewProductChange}
                  placeholder="0"
                  className="focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="new-min-stock" className="block text-sm font-medium mb-1 text-blue-800">Minimum Stock Level</label>
                <Input
                  id="new-min-stock"
                  name="min_stock_level"
                  type="number"
                  min="0"
                  value={newProduct.min_stock_level ?? 10}
                  onChange={handleNewProductChange}
                  placeholder="10"
                  className="focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="new-max-stock" className="block text-sm font-medium mb-1 text-blue-800">Maximum Stock Level</label>
                <Input
                  id="new-max-stock"
                  name="max_stock_level"
                  type="number"
                  min="0"
                  value={newProduct.max_stock_level ?? 100}
                  onChange={handleNewProductChange}
                  placeholder="100"
                  className="focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="new-description" className="block text-sm font-medium mb-1 text-gray-700">Short Description</label>
              <Textarea
                id="new-description"
                name="description"
                value={newProduct.description ?? ''}
                onChange={handleNewProductChange}
                placeholder="Brief description for product card"
                rows={2}
                className="focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-col md:flex-row gap-3 pt-4 border-t border-gray-200">
              <Button
                onClick={handleSaveNew}
                disabled={createProduct.isPending}
                className="bg-green-600 hover:bg-green-700 text-white shadow-sm w-full md:w-auto"
              >
                <SaveIcon className="w-4 h-4 mr-2" />
                {createProduct.isPending ? 'Saving...' : 'Save Product'}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancelNew}
                className="border-gray-300 hover:bg-gray-50 w-full md:w-auto"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </motion.div>
        )}

        {productsLoading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-blue-500 bg-blue-100 transition ease-in-out duration-150">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading products...
            </div>
          </div>
        ) : productsError ? (
          <div className="text-center py-12">
            <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-4 inline-block">
              <AlertTriangle className="w-5 h-5 mx-auto mb-2" />
              Error loading products: {productsError.message}
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-900 shadow-sm">
            {/* Mobile: Card layout, Desktop: Table layout */}
            <div className="md:hidden">
              {filteredProducts.map((product, index) => (
                <div key={product.id} className="border-b-2 border-gray-300 p-4 bg-white shadow-sm">
                  {editingProduct?.id === product.id ? (
                    // Mobile Edit Form
                    <div>
                      <div className="mb-2">
                        <label className="block text-xs font-medium mb-1 text-gray-700">Title *</label>
                        <Input
                          name="title"
                          value={editingProduct.title}
                          onChange={handleEditChange}
                          className="font-medium focus:ring-2 focus:ring-blue-500"
                          placeholder="Product title"
                        />
                      </div>
                      <div className="mb-2">
                        <label className="block text-xs font-medium mb-1 text-gray-700">Price (₹) *</label>
                        <Input
                          name="price"
                          value={editingProduct.price}
                          onChange={handleEditChange}
                          placeholder="100"
                          className="focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="mb-2">
                        <label className="block text-xs font-medium mb-1 text-gray-700">Unit *</label>
                        <Input
                          name="unit"
                          value={editingProduct.unit}
                          onChange={handleEditChange}
                          placeholder="1 L, 500g, etc."
                          className="focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          onClick={handleSaveEdit}
                          disabled={updateProduct.isPending}
                          className="bg-green-600 hover:bg-green-700 text-white flex-1 text-xs px-2"
                        >
                          <SaveIcon className="w-3 h-3 mr-1" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                          className="border-gray-300 flex-1 text-xs px-2"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Normal Product Card
                    <>
                      <div className="flex items-start gap-3 mb-3">
                        <img
                          src={product.image}
                          alt={product.title}
                          className="w-16 h-16 object-cover rounded-lg shadow-sm flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 mb-1 text-sm leading-tight">{product.title}</h3>
                          <div className="text-xs text-gray-600 mb-2">{product.unit}</div>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStockStatusColor(product.stock_status)}`}>
                              {product.stock_status === 'in_stock' ? '✓ In Stock' :
                                product.stock_status === 'low_stock' ? '⚠ Low Stock' : '✗ Out of Stock'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="bg-gray-50 p-2 rounded">
                          <div className="text-xs text-gray-500">Price</div>
                          <div className="font-semibold text-gray-900 text-sm">₹{product.price}</div>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <div className="text-xs text-gray-500">Stock</div>
                          <div className="font-semibold text-gray-900 text-sm">{product.stock_quantity}</div>
                        </div>
                      </div>

                      {/* Stock Action Buttons */}
                      <div className="flex gap-2 mb-3">
                        <Button
                          size="sm"
                          onClick={() => handleStockSave('add10', product)}
                          className="bg-green-500 hover:bg-green-600 text-white flex-1 text-xs px-2 py-1.5"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add 10 
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleStockUpdate(product)}
                          className="bg-blue-400 hover:bg-blue-500 border-black text-black flex-1 text-xs px-2 py-1.5"
                        >
                          <Package className="w-3 h-3 mr-1" />
                          Stock
                        </Button>
                      </div>

                      {/* Product Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(product)}
                          className="border-blue-900 text-blue-600 bg-slate-300 hover:bg-blue-500 flex-1 text-xs px-2 py-1.5"
                        >
                          <Pencil className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteClick(product.id)}
                          className="bg-red-600 hover:bg-red-600 hover:text-black shadow-sm flex-1 text-xs px-2 py-1.5"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete 
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-400 hover:bg-gray-500 transition-colors">
                    <TableHead className="font-bold text-black">Product</TableHead>
                    <TableHead className="font-bold text-black">Price & Quantity</TableHead>
                    <TableHead className="font-bold text-black text-center">Stock Management</TableHead>
                    <TableHead className="font-bold text-black text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product, index) => (
                    <TableRow
                      key={product.id}
                      className={`${
                        index % 2 === 0 ? 'bg-white' : 'hover:bg-gray-500'
                      } hover:bg-blue-50 transition-colors border border-gray-900 rounded-md shadow-sm`}
                    >
                      <TableCell className="py-4">
                        <div className="flex items-start gap-4">
                          <img
                            src={product.image}
                            alt={product.title}
                            className="w-16 h-16 object-cover rounded-lg shadow-sm"
                          />
                          <div className="flex-1 min-w-0">
                            {editingProduct?.id === product.id ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-xs font-medium mb-1 text-gray-700">Title *</label>
                                  <Input
                                    name="title"
                                    value={editingProduct.title}
                                    onChange={handleEditChange}
                                    className="font-medium focus:ring-2 focus:ring-blue-500"
                                    placeholder="Product title"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium mb-1 text-gray-700">Image URL</label>
                                  <Input
                                    name="image"
                                    value={editingProduct.image}
                                    onChange={handleEditChange}
                                    placeholder="https://example.com/image.jpg"
                                    className="focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium mb-1 text-gray-700">Price (₹) *</label>
                                  <Input
                                    name="price"
                                    value={editingProduct.price}
                                    onChange={handleEditChange}
                                    placeholder="100"
                                    className="focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium mb-1 text-gray-700">Unit *</label>
                                  <Input
                                    name="unit"
                                    value={editingProduct.unit}
                                    onChange={handleEditChange}
                                    placeholder="1 L, 500g, etc."
                                    className="focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="block text-xs font-medium mb-1 text-gray-700">Short Description</label>
                                  <Textarea
                                    name="description"
                                    value={editingProduct.description || ''}
                                    onChange={handleEditChange}
                                    placeholder="Brief description for product card"
                                    rows={2}
                                    className="focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium mb-1 text-blue-800">Stock Quantity</label>
                                  <Input
                                    name="stock_quantity"
                                    type="number"
                                    min="0"
                                    value={editingProduct.stock_quantity}
                                    onChange={handleEditChange}
                                    placeholder="0"
                                    className="focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium mb-1 text-blue-800">Min Stock Level</label>
                                  <Input
                                    name="min_stock_level"
                                    type="number"
                                    min="0"
                                    value={editingProduct.min_stock_level}
                                    onChange={handleEditChange}
                                    placeholder="10"
                                    className="focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                              </div>
                            ) : (
                              <div>
                                <h3 className="font-bold text-gray-900 mb-1">{product.title}</h3>
                                <div className="text-xs text-gray-500">{product.unit}</div>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockStatusColor(product.stock_status)}`}>
                                    {product.stock_status === 'in_stock' ? '✓ In Stock' :
                                      product.stock_status === 'low_stock' ? '⚠ Low Stock' : '✗ Out of Stock'}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-4">
                        <div>
                          <div className="font-semibold text-gray-900">₹{product.price}</div>
                          <div className="text-sm text-gray-600">{product.unit} available</div>
                        </div>
                      </TableCell>

                      <TableCell className="py-4">
                        <div className="text-center">
                          <div className="space-y-2">
                            <div className="flex items-center justify-center gap-3">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">{product.stock_quantity}</div>
                                <div className="text-xs text-gray-500">{product.unit}</div>
                              </div>
                              <div className="flex flex-col gap-1">
                                <Button
                                  size="sm"
                                  onClick={() => handleStockSave('add10', product)}
                                  className="bg-green-500 hover:bg-green-600 text-white h-8 px-2"
                                  title="Add 10 Instantly"
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Add 10
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleStockUpdate(product)}
                                  className="bg-blue-400 hover:bg-blue-500 border-black h-8 px-2 text-black"
                                  title="Modify Stock"
                                >
                                  <Package className="w-3 h-3 mr-1" />
                                  Modify
                                </Button>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">
                              Min: {product.min_stock_level} | Max: {product.max_stock_level}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-4">
                        <div className="flex flex-col items-center gap-2">
                          {editingProduct?.id === product.id ? (
                            <>
                              <Button
                                size="sm"
                                onClick={handleSaveEdit}
                                disabled={updateProduct.isPending}
                                className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                              >
                                <SaveIcon className="w-4 h-4 mr-1" />
                                Save Changes
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEdit}
                                className="border-gray-300 bg-red-400 hover:bg-red-500"
                              >
                                <X className="w-4 h-4 mr-1" />
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(product)}
                                className="border-blue-900 text-blue-600 bg-slate-300 hover:bg-blue-500"
                              >
                                <Pencil className="w-4 h-4 mr-1" />
                                Modify Product
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteClick(product.id)}
                                className="bg-red-600 hover:bg-red-600 hover:text-black shadow-sm"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete Product
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* Stock Update Modal */}
      {stockUpdateProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 sm:p-6">
          <div className="bg-white rounded-2xl w-full max-w-sm sm:max-w-md mx-auto p-5 sm:p-6 shadow-2xl transform transition-all duration-300 scale-100 max-h-[85vh] sm:max-h-[90vh] overflow-y-auto border border-gray-200">
            
            {/* Header */}
            <div className="text-center mb-5">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 leading-tight">
                Update Stock
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm font-medium text-blue-800 truncate">
                  {stockUpdateProduct.title}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Current Stock: <span className="font-semibold">{stockUpdateProduct.stock_quantity}</span> {stockUpdateProduct.unit}
                </p>
              </div>
            </div>

            {/* Quantity Input */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Quantity
              </label>
              <Input
                type="number"
                min="0"
                value={stockUpdateQuantity}
                onChange={(e) => setStockUpdateQuantity(parseInt(e.target.value) || 0)}
                placeholder="Enter quantity"
                className="w-full h-12 text-center text-lg font-medium border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => handleStockSave('add')}
                  disabled={updateStock.isPending}
                  className="bg-green-500 hover:bg-green-600 text-white h-11 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Stock
                </Button>
                <Button
                  onClick={() => handleStockSave('subtract')}
                  disabled={updateStock.isPending}
                  className="bg-orange-500 hover:bg-orange-600 text-white h-11 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Minus className="w-4 h-4" />
                  Remove
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => handleStockSave('set')}
                  disabled={updateStock.isPending}
                  className="bg-blue-500 hover:bg-blue-600 text-white h-11 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Set Exact
                </Button>
                <Button
                  onClick={() => handleStockSave('add10')}
                  disabled={updateStock.isPending}
                  className="bg-purple-500 hover:bg-purple-600 text-white h-11 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Quick +10
                </Button>
              </div>
            </div>

            {/* Out of Stock Button */}
            <Button
              onClick={() => {
                setStockUpdateQuantity(0);
                handleStockSave('set');
              }}
              disabled={updateStock.isPending}
              className="w-full bg-red-500 hover:bg-red-600 text-white h-11 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200 mb-4"
            >
              Mark Out of Stock
            </Button>

            {/* Cancel Button */}
            <Button
              variant="outline"
              onClick={() => {
                setStockUpdateProduct(null);
                setStockUpdateQuantity(0);
              }}
              className="w-full h-11 rounded-xl border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 font-medium transition-all duration-200"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleConfirmDelete}
        title="⚠️ Delete this product?"
        description="Are you sure you want to delete this product? This action cannot be undone."
      />
    </div>
  );
};

export default ProductsTab;
