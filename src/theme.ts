import { StyleSheet } from 'react-native';

export const colors = {
  primary: '#4A90D9',
  primaryLight: '#E8F0FE',
  primaryBorder: '#B8D4F0',
  danger: '#e74c3c',
  background: '#f8f9fa',
  surface: '#fff',
  text: '#333',
  textSecondary: '#888',
  textMuted: '#999',
  textSubtle: '#555',
  textNote: '#666',
  border: '#ddd',
  divider: '#f0f0f0',
  warning: '#f39c12',
  warningBackground: '#FEF3E2',
};

export const commonStyles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenContainerPadded: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    margin: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: colors.surface,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center' as const,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600' as const,
    fontSize: 16,
  },
  dangerButton: {
    backgroundColor: colors.danger,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center' as const,
  },
  dangerButtonText: {
    color: '#fff',
    fontWeight: '600' as const,
    fontSize: 15,
  },
  row: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
  },
  dividerRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
});
