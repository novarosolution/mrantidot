import { memo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AdminFilterChips } from '@/components/kit/AdminPageKit';
import { ChipsInput } from '@/components/kit/ChipsInput';
import { PestImage } from '@/components/kit/ServiceThumb';
import { ItemListEditor, SettingsNote } from '@/components/settings/SettingsKit';
import { SERVICE_TYPE_META } from '@/constants/serviceTypeMeta';
import { isServiceTypeKey } from '@/constants/serviceTypes';
import type { BusinessSettings, SettingsListItem, SettingsPropertyItem } from '@/types/api';
import { spacing } from '@/constants/theme';

type Lists = BusinessSettings['lists'];
type ListTab = 'categories' | 'propertyTypes' | 'pestTypes' | 'reviewTags' | 'leaveTypes';

const BUILT_IN_CATEGORIES = ['residential', 'commercial', 'cleaning', 'general'] as const;
const BUILT_IN_PROPERTY = ['1bhk', '2bhk', '3bhk', '4bhk', 'bungalow', 'office', 'cafe_restaurant', 'hotel', 'warehouse', 'factory'] as const;

const HINTS: Record<ListTab, string> = {
  categories:
    'Groups for services (service editor, home filters). Switched-off categories stay on existing services but can’t be picked for new ones.',
  propertyTypes:
    'What customers pick as “property type” when booking. Off = not offered any more; old bookings keep their type.',
  pestTypes:
    'Names of the pest / treatment types. They are fixed (each has its artwork) — rename them or switch one off to hide it from customers.',
  reviewTags: 'Quick tags customers can tap when they rate a visit. Up to 20.',
  leaveTypes: 'Kinds of leave a technician can ask for. Rename them or switch one off.',
};

export const ListsSection = memo(function ListsSection({
  lists,
  defaults,
  onChange,
}: {
  lists: Lists;
  defaults?: Lists;
  onChange: (next: Lists) => void;
}) {
  const [tab, setTab] = useState<ListTab>('categories');
  const set = <K extends keyof Lists>(key: K, value: Lists[K]) => onChange({ ...lists, [key]: value });
  const count = (items: { active: boolean }[]) => `${items.filter((i) => i.active).length}/${items.length}`;

  return (
    <>
      <View style={styles.tabs}>
        <AdminFilterChips
          inset
          chips={[
            { key: 'categories', label: `Categories ${count(lists.categories)}` },
            { key: 'propertyTypes', label: `Property types ${count(lists.propertyTypes)}` },
            { key: 'pestTypes', label: `Pest names ${count(lists.pestTypes)}` },
            { key: 'reviewTags', label: `Review tags ${lists.reviewTags.length}` },
            { key: 'leaveTypes', label: `Leave types ${count(lists.leaveTypes)}` },
          ]}
          selected={tab}
          onSelect={(k) => setTab(k as ListTab)}
        />
      </View>
      <SettingsNote>{HINTS[tab]}</SettingsNote>

      {tab === 'categories' ? (
        <>
          <ItemListEditor<SettingsListItem>
            items={lists.categories}
            onChange={(v) => set('categories', v)}
            defaults={defaults?.categories}
            fixed={BUILT_IN_CATEGORIES}
            canAdd
            addPlaceholder="New category, e.g. Sanitisation"
            addLabel="Add"
            labelMax={60}
            makeItem={(label, key) => ({ key, label, active: true })}
          />
          {!lists.categories.some((c) => c.active) ? <SettingsNote tone="warn">Keep at least one category on.</SettingsNote> : null}
        </>
      ) : null}

      {tab === 'propertyTypes' ? (
        <>
          <ItemListEditor<SettingsPropertyItem>
            items={lists.propertyTypes}
            onChange={(v) => set('propertyTypes', v)}
            defaults={defaults?.propertyTypes}
            fixed={BUILT_IN_PROPERTY}
            groups
            canAdd
            addPlaceholder="New type, e.g. Villa or Clinic"
            labelMax={60}
            makeItem={(label, key, group) => ({ key, label, group, active: true })}
          />
          {!lists.propertyTypes.some((p) => p.active) ? <SettingsNote tone="warn">Keep at least one property type on.</SettingsNote> : null}
        </>
      ) : null}

      {tab === 'pestTypes' ? (
        <ItemListEditor<SettingsListItem>
          items={lists.pestTypes}
          onChange={(v) => set('pestTypes', v)}
          defaults={defaults?.pestTypes}
          fixed={lists.pestTypes.map((p) => p.key)}
          labelMax={60}
          iconFor={(item) => {
            if (!isServiceTypeKey(item.key)) return null;
            const meta = SERVICE_TYPE_META[item.key];
            return (
              <View style={[styles.pest, { backgroundColor: meta.bg }]}>
                <PestImage source={meta.image} size={24} />
              </View>
            );
          }}
        />
      ) : null}

      {tab === 'reviewTags' ? (
        <ChipsInput
          label="Review tags"
          values={lists.reviewTags}
          onChange={(v) => set('reviewTags', v)}
          max={20}
          maxLength={40}
          placeholder="Add a tag, e.g. Friendly"
          hint="Type and press return — commas add several at once."
        />
      ) : null}

      {tab === 'leaveTypes' ? (
        <ItemListEditor<SettingsListItem>
          items={lists.leaveTypes}
          onChange={(v) => set('leaveTypes', v)}
          defaults={defaults?.leaveTypes}
          fixed={lists.leaveTypes.map((l) => l.key)}
          reorder={false}
          labelMax={40}
        />
      ) : null}
    </>
  );
});

/** First thing to fix in the lists, or null. */
export function listsProblem(lists: Lists): string | null {
  if (!lists.categories.some((c) => c.active)) return 'Keep at least one service category on';
  if (!lists.propertyTypes.some((p) => p.active)) return 'Keep at least one property type on';
  const unnamed = [...lists.categories, ...lists.propertyTypes, ...lists.pestTypes, ...lists.leaveTypes].find((i) => !i.label.trim());
  if (unnamed) return `Give “${unnamed.key}” a name`;
  return null;
}

const styles = StyleSheet.create({
  tabs: { marginHorizontal: -spacing.md, marginBottom: spacing.sm },
  pest: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
});
