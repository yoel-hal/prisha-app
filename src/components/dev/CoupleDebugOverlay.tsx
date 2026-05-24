import { useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useCouple } from '../../hooks/useCouple';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return String(value);
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

function DebugRow({ label, value }: { label: string; value: unknown }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} selectable>
        {formatValue(value)}
      </Text>
    </View>
  );
}

function CoupleDebugOverlayContent() {
  const [expanded, setExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const user = useAuthStore((s) => s.user);
  const coupleId = useAuthStore((s) => s.coupleId);
  const pendingInvite = useAuthStore((s) => s.pendingInvite);
  const partnerEmail = useAuthStore((s) => s.partnerEmail);
  const outgoingInvite = useAuthStore((s) => s.outgoingInvite);
  const isCoupleBootstrapping = useAuthStore((s) => s.isCoupleBootstrapping);
  const minhag = useSettingsStore((s) => s.minhag);

  const { refreshCoupleState } = useCouple();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshCoupleState();
    } finally {
      setRefreshing(false);
    }
  }, [refreshCoupleState]);

  return (
    <View style={styles.root} pointerEvents="box-none">
      {expanded ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Couple sync (DEV)</Text>
          <ScrollView style={styles.scroll} nestedScrollEnabled>
            <DebugRow label="user.uid" value={user?.uid ?? null} />
            <DebugRow label="user.email" value={user?.email ?? null} />
            <DebugRow label="coupleId" value={coupleId} />
            <DebugRow label="pendingInvite" value={pendingInvite} />
            <DebugRow label="partnerEmail" value={partnerEmail} />
            <DebugRow label="outgoingInvite" value={outgoingInvite} />
            <DebugRow label="isCoupleBootstrapping" value={isCoupleBootstrapping} />
            <DebugRow label="settings.minhag" value={minhag} />
          </ScrollView>
          <TouchableOpacity
            style={[styles.refreshButton, refreshing && styles.refreshButtonDisabled]}
            onPress={() => void handleRefresh()}
            disabled={refreshing}
          >
            <Text style={styles.refreshButtonText}>
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <TouchableOpacity
        style={styles.toggle}
        onPress={() => setExpanded((open) => !open)}
        activeOpacity={0.85}
      >
        <Text style={styles.toggleText}>DEV</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function CoupleDebugOverlay() {
  if (!__DEV__) {
    return null;
  }

  return <CoupleDebugOverlayContent />;
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 12,
    bottom: 88,
    zIndex: 9999,
    alignItems: 'flex-start',
  },
  toggle: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    opacity: 0.92,
  },
  toggleText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  panel: {
    width: 280,
    maxHeight: 340,
    marginBottom: 8,
    backgroundColor: 'rgba(26, 26, 26, 0.94)',
    borderRadius: 8,
    padding: 10,
  },
  panelTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  scroll: {
    maxHeight: 240,
  },
  row: {
    marginBottom: 8,
  },
  rowLabel: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  rowValue: {
    color: '#f3f4f6',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  refreshButton: {
    marginTop: 8,
    backgroundColor: '#3b82f6',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  refreshButtonDisabled: {
    opacity: 0.6,
  },
  refreshButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});
