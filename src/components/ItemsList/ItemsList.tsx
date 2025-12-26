'use client';

import { ItemRow } from '@/components/ItemRow';
import type { ItemRowViewModel, ItemCategoryGroup } from '@/types';
import styles from './ItemsList.module.css';

interface ItemsListProps {
  items: ItemRowViewModel[];
  groups: ItemCategoryGroup[];
  grouped: boolean;
}

export function ItemsList({ items, groups, grouped }: ItemsListProps) {
  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No items needed</p>
        <p className={styles.emptyHint}>
          Set your station levels to see required items
        </p>
      </div>
    );
  }

  if (grouped) {
    return (
      <div className={styles.groupedList}>
        {groups.map((group) => (
          <div key={group.categoryId} className={styles.group}>
            <h3 className={styles.groupTitle}>{group.categoryName}</h3>
            <div className={styles.groupItems}>
              {group.items.map((item) => (
                <ItemRow key={item.itemId} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {items.map((item) => (
        <ItemRow key={item.itemId} item={item} />
      ))}
    </div>
  );
}
