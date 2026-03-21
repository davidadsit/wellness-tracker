import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {AddTagInline} from '../../../../src/components/checkin/AddTagInline';

describe('AddTagInline', () => {
  it('shows add button initially', () => {
    const {getByText} = render(<AddTagInline onAdd={jest.fn()} testID="add-tag" />);
    expect(getByText('+')).toBeTruthy();
  });

  it('shows input and buttons after pressing add', () => {
    const {getByText, getByTestId} = render(
      <AddTagInline onAdd={jest.fn()} testID="add-tag" />,
    );

    fireEvent.press(getByText('+'));

    expect(getByTestId('add-tag-input')).toBeTruthy();
    expect(getByText('Add')).toBeTruthy();
    expect(getByText('Cancel')).toBeTruthy();
  });

  it('calls onAdd with trimmed text on confirm', () => {
    const onAdd = jest.fn();
    const {getByText, getByTestId} = render(
      <AddTagInline onAdd={onAdd} testID="add-tag" />,
    );

    fireEvent.press(getByText('+'));
    fireEvent.changeText(getByTestId('add-tag-input'), '  New Tag  ');
    fireEvent.press(getByText('Add'));

    expect(onAdd).toHaveBeenCalledWith('New Tag');
  });

  it('does not call onAdd when input is empty', () => {
    const onAdd = jest.fn();
    const {getByText, getByTestId} = render(
      <AddTagInline onAdd={onAdd} testID="add-tag" />,
    );

    fireEvent.press(getByText('+'));
    fireEvent.changeText(getByTestId('add-tag-input'), '   ');
    fireEvent.press(getByText('Add'));

    expect(onAdd).not.toHaveBeenCalled();
  });

  it('returns to add button after cancel', () => {
    const {getByText, queryByText} = render(
      <AddTagInline onAdd={jest.fn()} testID="add-tag" />,
    );

    fireEvent.press(getByText('+'));
    expect(queryByText('Cancel')).toBeTruthy();

    fireEvent.press(getByText('Cancel'));
    expect(getByText('+')).toBeTruthy();
    expect(queryByText('Cancel')).toBeNull();
  });

  it('calls onAdd on submit editing (keyboard done)', () => {
    const onAdd = jest.fn();
    const {getByText, getByTestId} = render(
      <AddTagInline onAdd={onAdd} testID="add-tag" />,
    );

    fireEvent.press(getByText('+'));
    fireEvent.changeText(getByTestId('add-tag-input'), 'Keyboard Tag');
    fireEvent(getByTestId('add-tag-input'), 'submitEditing');

    expect(onAdd).toHaveBeenCalledWith('Keyboard Tag');
  });
});
