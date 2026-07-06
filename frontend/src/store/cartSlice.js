import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../utils/api';

export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/cart');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch cart' });
    }
  }
);

export const addToCart = createAsyncThunk(
  'cart/add',
  async (itemData, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.post('/cart/add', itemData);
      dispatch(fetchCart());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to add to cart' });
    }
  }
);

export const updateCartQuantity = createAsyncThunk(
  'cart/updateQuantity',
  async ({ id, quantity }, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.put(`/cart/update/${id}`, { quantity });
      dispatch(fetchCart());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to update cart' });
    }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/remove',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.delete(`/cart/remove/${id}`);
      dispatch(fetchCart());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to remove from cart' });
    }
  }
);

export const mergeCartOnLogin = createAsyncThunk(
  'cart/merge',
  async (guestToken, { rejectWithValue }) => {
    try {
      const response = await api.post('/cart/merge', { guest_token: guestToken });
      return response.data.cart;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to merge cart' });
    }
  }
);

const initialState = {
  items: [],
  loading: false,
  error: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearCartState: (state) => {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(mergeCartOnLogin.fulfilled, (state, action) => {
        state.items = action.payload;
      });
  },
});

export const { clearCartState } = cartSlice.actions;
export default cartSlice.reducer;
