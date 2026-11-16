import { StyleSheet } from 'react-native';

export const authFormStyles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FBF8F5',
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
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 16,
    color: '#5F5459',
    marginBottom: 8,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5F5459',
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#DDD3CC',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  error: {
    fontSize: 14,
    color: '#B3261E',
    backgroundColor: '#FBEAE8',
    padding: 12,
    borderRadius: 8,
  },
  success: {
    fontSize: 14,
    color: '#2F7D55',
    backgroundColor: '#E6F2EB',
    padding: 12,
    borderRadius: 8,
  },
  primaryButton: {
    backgroundColor: '#A8485F',
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
    backgroundColor: '#F4EFEA',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#EAE3DD',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  secondaryButtonText: {
    color: '#2A2226',
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
    color: '#5F5459',
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
    color: '#5F5459',
  },
});
