import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { useAlignStart, textStartStyle } from '../../utils/rtl';

type ProfileFormFieldsProps = {
  firstName: string;
  setFirstName: (value: string) => void;
  lastName: string;
  setLastName: (value: string) => void;
  country: string;
  setCountry: (value: string) => void;
  phone: string;
  setPhone: (value: string) => void;
  disabled?: boolean;
};

export function ProfileFormFields({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  country,
  setCountry,
  phone,
  setPhone,
  disabled = false,
}: ProfileFormFieldsProps) {
  const { t } = useTranslation();
  const textStart = useAlignStart();

  return (
    <View style={styles.fields}>
      <View style={styles.field}>
        <Text style={[styles.label, textStartStyle()]}>{t('onboarding.firstName')}</Text>
        <TextInput
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
          autoCorrect={false}
          textContentType="givenName"
          editable={!disabled}
          textAlign={textStart}
          placeholder={t('onboarding.firstNamePlaceholder')}
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, textStartStyle()]}>{t('onboarding.lastName')}</Text>
        <TextInput
          style={styles.input}
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize="words"
          autoCorrect={false}
          textContentType="familyName"
          editable={!disabled}
          textAlign={textStart}
          placeholder={t('onboarding.lastNamePlaceholder')}
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, textStartStyle()]}>{t('onboarding.country')}</Text>
        <TextInput
          style={styles.input}
          value={country}
          onChangeText={setCountry}
          autoCapitalize="words"
          autoCorrect={false}
          editable={!disabled}
          textAlign={textStart}
          placeholder={t('onboarding.countryPlaceholder')}
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, textStartStyle()]}>{t('onboarding.phone')}</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          autoCorrect={false}
          textContentType="telephoneNumber"
          editable={!disabled}
          textAlign={textStart}
          placeholder={t('onboarding.phonePlaceholder')}
          placeholderTextColor="#999"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fields: {
    gap: 16,
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
    color: '#1a1a1a',
    backgroundColor: '#fafafa',
    minHeight: 48,
  },
});
