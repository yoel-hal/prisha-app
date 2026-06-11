import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import {
  CountryPickerField,
  type CountryPickerFieldHandle,
} from '../common/CountryPickerField';
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
  firstNameRef: RefObject<TextInput | null>;
  lastNameRef: RefObject<TextInput | null>;
  countryPickerRef: RefObject<CountryPickerFieldHandle | null>;
  phoneRef: RefObject<TextInput | null>;
  onPhoneSubmitEditing?: () => void;
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
  firstNameRef,
  lastNameRef,
  countryPickerRef,
  phoneRef,
  onPhoneSubmitEditing,
}: ProfileFormFieldsProps) {
  const { t } = useTranslation();
  const textStart = useAlignStart();

  function handleCountryChange(value: string) {
    setCountry(value);
    phoneRef.current?.focus();
  }

  return (
    <View style={styles.fields}>
      <View style={styles.field}>
        <Text style={[styles.label, textStartStyle()]}>{t('onboarding.firstName')}</Text>
        <TextInput
          ref={firstNameRef}
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
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => lastNameRef.current?.focus()}
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, textStartStyle()]}>{t('onboarding.lastName')}</Text>
        <TextInput
          ref={lastNameRef}
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
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => {
            if (country.trim()) {
              phoneRef.current?.focus();
            } else {
              countryPickerRef.current?.open();
            }
          }}
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, textStartStyle()]}>{t('onboarding.country')}</Text>
        <CountryPickerField
          ref={countryPickerRef}
          value={country}
          onChange={handleCountryChange}
          placeholder={t('onboarding.countryPlaceholder')}
          editable={!disabled}
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, textStartStyle()]}>{t('onboarding.phone')}</Text>
        <TextInput
          ref={phoneRef}
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
          returnKeyType="done"
          onSubmitEditing={onPhoneSubmitEditing}
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
