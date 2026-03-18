import tagsReducer, {
  fetchAllTags,
  createCategory,
  createTag,
  deleteTag,
  TagsState,
} from '../../src/store/tagsSlice';
import {tagRepository} from '../../src/services/database/tagRepository';

jest.mock('../../src/services/database/tagRepository');

const mockedRepo = tagRepository as jest.Mocked<typeof tagRepository>;

const initialState: TagsState = {
  categories: [],
  tags: [],
  loading: false,
  error: null,
};

describe('tagsSlice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('reducers', () => {
    it('returns the initial state', () => {
      expect(tagsReducer(undefined, {type: 'unknown'})).toEqual(initialState);
    });
  });

  describe('fetchAllTags', () => {
    it('sets loading true on pending', () => {
      const state = tagsReducer(initialState, fetchAllTags.pending('', undefined));
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('stores categories and tags on fulfilled', () => {
      const categories = [{id: 'c1', name: 'Mental', sortOrder: 1, isDefault: true, createdAt: 0}];
      const tags = [{id: 't1', categoryId: 'c1', label: 'Calm', isDefault: true, createdAt: 0}];

      const state = tagsReducer(
        {...initialState, loading: true},
        fetchAllTags.fulfilled({categories, tags}, '', undefined),
      );

      expect(state.loading).toBe(false);
      expect(state.categories).toEqual(categories);
      expect(state.tags).toEqual(tags);
    });

    it('sets error on rejected', () => {
      const state = tagsReducer(
        {...initialState, loading: true},
        fetchAllTags.rejected(new Error('DB error'), '', undefined),
      );
      expect(state.loading).toBe(false);
      expect(state.error).toBe('DB error');
    });
  });

  describe('createCategory', () => {
    it('adds new category on fulfilled', () => {
      const newCat = {id: 'c2', name: 'Social', sortOrder: 5, isDefault: false, createdAt: 123};
      const state = tagsReducer(
        initialState,
        createCategory.fulfilled(newCat, '', {name: 'Social', sortOrder: 5}),
      );
      expect(state.categories).toHaveLength(1);
      expect(state.categories[0].name).toBe('Social');
    });
  });

  describe('createTag', () => {
    it('adds new tag on fulfilled', () => {
      const newTag = {id: 't2', categoryId: 'c1', label: 'Motivated', isDefault: false, createdAt: 123};
      const state = tagsReducer(
        initialState,
        createTag.fulfilled(newTag, '', {categoryId: 'c1', label: 'Motivated'}),
      );
      expect(state.tags).toHaveLength(1);
      expect(state.tags[0].label).toBe('Motivated');
    });
  });

  describe('deleteTag', () => {
    it('removes tag on fulfilled', () => {
      const stateWithTag: TagsState = {
        ...initialState,
        tags: [{id: 't1', categoryId: 'c1', label: 'Calm', isDefault: false, createdAt: 0}],
      };
      const state = tagsReducer(stateWithTag, deleteTag.fulfilled('t1', '', 't1'));
      expect(state.tags).toHaveLength(0);
    });
  });
});
