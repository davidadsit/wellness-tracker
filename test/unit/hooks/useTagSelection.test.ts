import {renderHook, act} from '@testing-library/react-native';
import {useTagSelection} from '../../../src/hooks/useTagSelection';

describe('useTagSelection', () => {
  it('starts with empty selection', () => {
    const {result} = renderHook(() => useTagSelection());
    expect(result.current.selectedTagIds).toEqual([]);
  });

  it('adds a tag when toggled', () => {
    const {result} = renderHook(() => useTagSelection());
    act(() => result.current.toggleTag('t1'));
    expect(result.current.selectedTagIds).toEqual(['t1']);
  });

  it('removes a tag when toggled again', () => {
    const {result} = renderHook(() => useTagSelection());
    act(() => result.current.toggleTag('t1'));
    act(() => result.current.toggleTag('t1'));
    expect(result.current.selectedTagIds).toEqual([]);
  });

  it('supports multiple selected tags', () => {
    const {result} = renderHook(() => useTagSelection());
    act(() => result.current.toggleTag('t1'));
    act(() => result.current.toggleTag('t2'));
    act(() => result.current.toggleTag('t3'));
    expect(result.current.selectedTagIds).toEqual(['t1', 't2', 't3']);
  });

  it('removes only the toggled tag, keeping others', () => {
    const {result} = renderHook(() => useTagSelection());
    act(() => result.current.toggleTag('t1'));
    act(() => result.current.toggleTag('t2'));
    act(() => result.current.toggleTag('t1'));
    expect(result.current.selectedTagIds).toEqual(['t2']);
  });

  it('clears all tags on resetSelection', () => {
    const {result} = renderHook(() => useTagSelection());
    act(() => result.current.toggleTag('t1'));
    act(() => result.current.toggleTag('t2'));
    act(() => result.current.resetSelection());
    expect(result.current.selectedTagIds).toEqual([]);
  });
});
