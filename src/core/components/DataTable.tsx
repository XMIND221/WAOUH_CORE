import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
type Column<T> = {
  key: string;
  label: string;
  width?: number;
  align?: "left" | "right";
  render?: (row: T) => React.ReactNode;
};
type Props<T> = {
  columns: Column<T>[];
  data: T[];
  emptyText?: string;
};
export function DataTable<T>({ columns, data, emptyText = "No data" }: Props<T>) {
  return (
    <ScrollView horizontal>
      <View style={styles.table}>
        <View style={styles.headerRow}>
          {columns.map((col) => (
            <Text
              key={col.key}
              style={[
                styles.headerCell,
                col.width ? { width: col.width } : { flex: 1 },
                col.align === "right" ? styles.alignRight : null,
              ]}
            >
              {col.label}
            </Text>
          ))}
        </View>
        {data.length === 0 ? (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>{emptyText}</Text>
          </View>
        ) : (
          data.map((row: any, index) => (
            <View key={row.id ?? index} style={styles.bodyRow}>
              {columns.map((col) => (
                <View
                  key={col.key}
                  style={[
                    styles.bodyCell,
                    col.width ? { width: col.width } : { flex: 1 },
                    col.align === "right" ? styles.alignRight : null,
                  ]}
                >
                  {col.render ? (
                    col.render(row)
                  ) : (
                    <Text style={styles.bodyText}>{String(row[col.key] ?? "")}</Text>
                  )}
                </View>
              ))}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  table: { minWidth: 640, borderWidth: 1, borderColor: colors.border, borderRadius: 16 },
  headerRow: {
    flexDirection: "row",
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerCell: {
    color: colors.muted,
    fontSize: typography.small.fontSize,
    fontWeight: typography.small.fontWeight,
  },
  bodyRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bodyCell: { justifyContent: "center" },
  bodyText: { color: colors.text, fontSize: typography.body.fontSize },
  alignRight: { alignItems: "flex-end" },
  emptyRow: { padding: 16 },
  emptyText: { color: colors.muted },
});
