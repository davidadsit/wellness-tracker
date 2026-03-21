import React from 'react';
import {Alert} from 'react-native';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {TagManagementScreen} from '../../../src/screens/TagManagementScreen';
import {CheckInScreen} from '../../../src/screens/CheckInScreen';
import {setupTestDatabase} from '../../helpers/database';
import {makeStore} from '../../helpers/renderWithStore';
import {tagRepository} from '../../../src/services/database/tagRepository';
import {checkInRepository} from '../../../src/services/database/checkInRepository';
import {MMKV} from 'react-native-mmkv';

jest.spyOn(Alert, 'alert');

setupTestDatabase();

beforeEach(() => {
  new MMKV().clearAll();
  (Alert.alert as jest.Mock).mockClear();
});

function renderScreen(ui: React.ReactElement, store = makeStore()) {
  return {...render(<Provider store={store}>{ui}</Provider>), store};
}

describe('tag management workflow', () => {
  it('user sees all default tag categories', async () => {
    const {getByText} = renderScreen(<TagManagementScreen />);

    await waitFor(() => {
      expect(getByText('Mental Health')).toBeTruthy();
      expect(getByText('Physical Health')).toBeTruthy();
      expect(getByText('Symptoms')).toBeTruthy();
      expect(getByText('Emotional Health')).toBeTruthy();
    });
  });

  it('user sees default tags within categories', async () => {
    const {getByText} = renderScreen(<TagManagementScreen />);

    await waitFor(() => {
      expect(getByText('Focused')).toBeTruthy();
      expect(getByText('Energized')).toBeTruthy();
      expect(getByText('Happy')).toBeTruthy();
      expect(getByText('Headache')).toBeTruthy();
    });
  });

  it('user creates a new category', async () => {
    const {getByTestId, getByText} = renderScreen(<TagManagementScreen />);

    await waitFor(() => {
      expect(getByText('Mental Health')).toBeTruthy();
    });

    fireEvent.changeText(getByTestId('new-category-input'), 'Social');
    fireEvent.press(getByTestId('add-category-button'));

    await waitFor(() => {
      expect(getByText('Social')).toBeTruthy();
    });

    const categories = await tagRepository.getAllCategories();
    expect(categories.find(c => c.name === 'Social')).toBeTruthy();
  });

  it('user adds a custom tag to an existing category', async () => {
    const {getByText, getAllByText, getByTestId} = renderScreen(
      <TagManagementScreen />,
    );

    await waitFor(() => {
      expect(getByText('Mental Health')).toBeTruthy();
    });

    const categories = await tagRepository.getAllCategories();
    const mentalCategory = categories.find(c => c.name === 'Mental Health')!;

    const addTagButtons = getAllByText('+ Add Tag');
    fireEvent.press(addTagButtons[0]);

    await waitFor(() => {
      expect(getByTestId(`new-tag-input-${mentalCategory.id}`)).toBeTruthy();
    });

    fireEvent.changeText(
      getByTestId(`new-tag-input-${mentalCategory.id}`),
      'Inspired',
    );
    fireEvent.press(getByTestId(`submit-new-tag-${mentalCategory.id}`));

    await waitFor(() => {
      expect(getByText('Inspired')).toBeTruthy();
    });

    const tags = await tagRepository.getAllTags();
    expect(tags.find(t => t.label === 'Inspired')).toBeTruthy();
  });

  it('user edits a custom tag name', async () => {
    const customTag = await tagRepository.createTag('cat-mental', 'Inspired');

    const {getByText, getByTestId} = renderScreen(<TagManagementScreen />);

    await waitFor(() => {
      expect(getByText('Inspired')).toBeTruthy();
    });

    fireEvent.press(getByText('Inspired'));

    await waitFor(() => {
      expect(getByTestId(`edit-tag-input-${customTag.id}`)).toBeTruthy();
    });

    fireEvent.changeText(
      getByTestId(`edit-tag-input-${customTag.id}`),
      'Creative',
    );
    fireEvent.press(getByTestId(`save-tag-${customTag.id}`));

    await waitFor(() => {
      expect(getByText('Creative')).toBeTruthy();
    });

    const tags = await tagRepository.getAllTags();
    expect(tags.find(t => t.id === customTag.id)?.label).toBe('Creative');
  });

  it('user removes a tag that has no check-in usage and it is deleted', async () => {
    const customTag = await tagRepository.createTag('cat-mental', 'Temporary');

    const {getByText, getByTestId, queryByText} = renderScreen(
      <TagManagementScreen />,
    );

    await waitFor(() => {
      expect(getByText('Temporary')).toBeTruthy();
    });

    fireEvent.press(getByText('Temporary'));

    await waitFor(() => {
      expect(getByTestId(`delete-tag-${customTag.id}`)).toBeTruthy();
    });

    fireEvent.press(getByTestId(`delete-tag-${customTag.id}`));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Remove Tag',
        'Remove tag? If used in check-ins, it will be archived.',
        expect.any(Array),
      );
    });

    const alertArgs = (Alert.alert as jest.Mock).mock.calls[0];
    const removeButton = alertArgs[2].find((b: any) => b.text === 'Remove');
    await removeButton.onPress();

    await waitFor(() => {
      expect(queryByText('Temporary')).toBeNull();
    });

    const tags = await tagRepository.getAllTags();
    expect(tags.find(t => t.id === customTag.id)).toBeUndefined();
  });

  it('user removes a tag that has check-in usage and it is archived', async () => {
    const customTag = await tagRepository.createTag('cat-mental', 'Used Tag');

    await checkInRepository.create({
      tagIds: [customTag.id],
      note: 'test',
    });

    const {getByText, getByTestId, queryByText} = renderScreen(
      <TagManagementScreen />,
    );

    await waitFor(() => {
      expect(getByText('Used Tag')).toBeTruthy();
    });

    fireEvent.press(getByText('Used Tag'));

    await waitFor(() => {
      expect(getByTestId(`delete-tag-${customTag.id}`)).toBeTruthy();
    });

    fireEvent.press(getByTestId(`delete-tag-${customTag.id}`));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalled();
    });

    const alertArgs = (Alert.alert as jest.Mock).mock.calls[0];
    const removeButton = alertArgs[2].find((b: any) => b.text === 'Remove');
    await removeButton.onPress();

    await waitFor(() => {
      expect(queryByText('Used Tag')).toBeNull();
    });

    const activeTags = await tagRepository.getAllTags();
    expect(activeTags.find(t => t.id === customTag.id)).toBeUndefined();

    const allTags = await tagRepository.getAllTagsIncludingArchived();
    const archivedTag = allTags.find(t => t.id === customTag.id);
    expect(archivedTag).toBeTruthy();
    expect(archivedTag!.isArchived).toBe(true);
  });

  it('custom tag created during check-in is available for selection', async () => {
    const store = makeStore();
    const {getByText, getByTestId} = renderScreen(<CheckInScreen />, store);

    await waitFor(() => {
      expect(getByText('Mental Health')).toBeTruthy();
    });

    fireEvent.press(getByTestId('add-tag-category-cat-mental'));

    await waitFor(() => {
      expect(getByTestId('add-tag-category-cat-mental-input')).toBeTruthy();
    });

    fireEvent.changeText(
      getByTestId('add-tag-category-cat-mental-input'),
      'Motivated',
    );
    fireEvent.press(getByTestId('add-tag-category-cat-mental-confirm'));

    await waitFor(() => {
      expect(getByText('Motivated')).toBeTruthy();
    });

    const tags = await tagRepository.getAllTags();
    expect(tags.find(t => t.label === 'Motivated')).toBeTruthy();
  });
});
