import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

const COUNTRIES: { code: string; en: string; he: string }[] = [
  { code: 'IL', en: 'Israel', he: 'ישראל' },
  { code: 'US', en: 'United States', he: 'ארצות הברית' },
  { code: 'GB', en: 'United Kingdom', he: 'בריטניה' },
  { code: 'CA', en: 'Canada', he: 'קנדה' },
  { code: 'AU', en: 'Australia', he: 'אוסטרליה' },
  { code: 'FR', en: 'France', he: 'צרפת' },
  { code: 'DE', en: 'Germany', he: 'גרמניה' },
  { code: 'BR', en: 'Brazil', he: 'ברזיל' },
  { code: 'AR', en: 'Argentina', he: 'ארגנטינה' },
  { code: 'ZA', en: 'South Africa', he: 'דרום אפריקה' },
  { code: 'RU', en: 'Russia', he: 'רוסיה' },
  { code: 'UA', en: 'Ukraine', he: 'אוקראינה' },
  { code: 'BE', en: 'Belgium', he: 'בלגיה' },
  { code: 'NL', en: 'Netherlands', he: 'הולנד' },
  { code: 'CH', en: 'Switzerland', he: 'שווייץ' },
  { code: 'AT', en: 'Austria', he: 'אוסטריה' },
  { code: 'SE', en: 'Sweden', he: 'שוודיה' },
  { code: 'NO', en: 'Norway', he: 'נורווגיה' },
  { code: 'DK', en: 'Denmark', he: 'דנמרק' },
  { code: 'MX', en: 'Mexico', he: 'מקסיקו' },
  { code: 'ES', en: 'Spain', he: 'ספרד' },
  { code: 'IT', en: 'Italy', he: 'איטליה' },
  { code: 'PT', en: 'Portugal', he: 'פורטוגל' },
  { code: 'PL', en: 'Poland', he: 'פולין' },
  { code: 'HU', en: 'Hungary', he: 'הונגריה' },
  { code: 'TR', en: 'Turkey', he: 'טורקיה' },
  { code: 'GR', en: 'Greece', he: 'יוון' },
  { code: 'NZ', en: 'New Zealand', he: 'ניו זילנד' },
  { code: 'SG', en: 'Singapore', he: 'סינגפור' },
  { code: 'IN', en: 'India', he: 'הודו' },
];

type CountryPickerFieldProps = {
  value: string;
  onChange: (countryName: string) => void;
  placeholder?: string;
  editable?: boolean;
};

export function CountryPickerField({
  value,
  onChange,
  placeholder,
  editable = true,
}: CountryPickerFieldProps) {
  const { i18n } = useTranslation();
  const isHebrew = i18n.language === 'he';
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) {
      return COUNTRIES;
    }
    return COUNTRIES.filter(
      (c) =>
        c.en.toLowerCase().includes(q) ||
        c.he.includes(q) ||
        c.code.toLowerCase().includes(q),
    );
  }, [search]);

  function getLabel(c: { en: string; he: string }) {
    return isHebrew ? c.he : c.en;
  }

  function handleSelect(c: { en: string; he: string }) {
    onChange(isHebrew ? c.he : c.en);
    setModalVisible(false);
    setSearch('');
  }

  function closeModal() {
    setModalVisible(false);
    setSearch('');
  }

  return (
    <>
      <Pressable
        onPress={() => editable && setModalVisible(true)}
        style={[styles.trigger, !editable && styles.disabled]}
      >
        <Text style={[styles.triggerText, !value && styles.placeholder]}>
          {value || placeholder || ''}
        </Text>
        <Text style={styles.chevron}>▼</Text>
      </Pressable>

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TextInput
              style={styles.search}
              value={search}
              onChangeText={setSearch}
              placeholder={isHebrew ? 'חיפוש...' : 'Search...'}
              autoFocus
            />
            <Pressable onPress={closeModal}>
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <Pressable style={styles.row} onPress={() => handleSelect(item)}>
                <Text style={styles.rowText}>{getLabel(item)}</Text>
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  disabled: { opacity: 0.5 },
  triggerText: { fontSize: 16, color: '#000', flex: 1 },
  placeholder: { color: '#999' },
  chevron: { fontSize: 12, color: '#666', marginStart: 8 },
  modal: { flex: 1, backgroundColor: '#fff', paddingTop: 50 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 12,
  },
  search: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  close: { fontSize: 20, color: '#666', padding: 4 },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rowText: { fontSize: 16 },
});
