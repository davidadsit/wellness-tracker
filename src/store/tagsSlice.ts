import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import {TagCategory, Tag} from '../types';
import {tagRepository} from '../services/database/tagRepository';
import {ulid} from '../utils/ulid';

export interface TagsState {
  categories: TagCategory[];
  tags: Tag[];
  loading: boolean;
}

const initialState: TagsState = {
  categories: [],
  tags: [],
  loading: false,
};

export const fetchAllTags = createAsyncThunk('tags/fetchAll', async () => {
  const categories = await tagRepository.loadAllCategories();
  const tags = await tagRepository.loadAllTags();
  return {categories, tags};
});

export const createCategory = createAsyncThunk(
  'tags/createCategory',
  async (params: {name: string; sortOrder: number}) => {
    return tagRepository.saveCategory({
      id: ulid(),
      name: params.name,
      sortOrder: params.sortOrder,
      isDefault: false,
      createdAt: Date.now(),
    });
  },
);

export const createTag = createAsyncThunk(
  'tags/createTag',
  async (params: {categoryId: string; label: string}) => {
    return tagRepository.saveTag({
      id: ulid(),
      categoryId: params.categoryId,
      label: params.label,
      isDefault: false,
      isArchived: false,
      createdAt: Date.now(),
    });
  },
);

export const updateTag = createAsyncThunk(
  'tags/updateTag',
  async (params: {id: string; label: string}) => {
    const tag = await tagRepository.loadTag(params.id);
    if (tag) {
      await tagRepository.saveTag({...tag, label: params.label});
    }
    return params;
  },
);

export const removeTag = createAsyncThunk(
  'tags/removeTag',
  async (id: string) => {
    await tagRepository.removeTag(id);
    return id;
  },
);

const tagsSlice = createSlice({
  name: 'tags',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchAllTags.pending, state => {
        state.loading = true;
      })
      .addCase(fetchAllTags.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload.categories;
        state.tags = action.payload.tags;
      })
      .addCase(fetchAllTags.rejected, state => {
        state.loading = false;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.categories.push(action.payload);
      })
      .addCase(createTag.fulfilled, (state, action) => {
        state.tags.push(action.payload);
      })
      .addCase(updateTag.fulfilled, (state, action) => {
        const tag = state.tags.find(t => t.id === action.payload.id);
        if (tag) {
          tag.label = action.payload.label;
        }
      })
      .addCase(removeTag.fulfilled, (state, action) => {
        state.tags = state.tags.filter(t => t.id !== action.payload);
      });
  },
});

export default tagsSlice.reducer;
