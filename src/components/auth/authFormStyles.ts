import { StyleSheet } from 'react-native';

export const authFormStyles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  error: {
    fontSize: 14,
    color: '#C62828',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
  },
  success: {
    fontSize: 14,
    color: '#2E7D32',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
  },
  primaryButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryDisabled: {
    opacity: 0.6,
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  secondaryButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '600',
  },
  linkRow: {
    alignSelf: 'center',
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  linkText: {
    fontSize: 15,
    color: '#666',
  },
  linkAction: {
    fontSize: 15,
    color: '#4285F4',
    fontWeight: '600',
  },
  forgotLink: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  forgotText: {
    fontSize: 14,
    color: '#4285F4',
  },
  backLink: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
  backText: {
    fontSize: 15,
    color: '#666',
  },
});
