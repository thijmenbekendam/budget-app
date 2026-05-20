import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { PieChart } from 'react-native-chart-kit';
import { loadExpenses } from '../storage';
import { Category, CATEGORY_COLORS, Expense } from '../types';

const screenWidth = Dimensions.get('window').width;

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadExpenses().then(setExpenses);
    }, [])
  );

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  const chartData = Object.entries(byCategory).map(([name, amount]) => ({
    name,
    amount,
    color: CATEGORY_COLORS[name as Category],
    legendFontColor: '#333',
    legendFontSize: 12,
  }));

  const recent = expenses.slice(0, 5);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Spent</Text>
        <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
      </View>

      {chartData.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spending by Category</Text>
          <PieChart
            data={chartData}
            width={screenWidth - 32}
            height={200}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>
      ) : (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyText}>No expenses yet</Text>
          <Text style={styles.emptySubtext}>Add your first expense to see a chart</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Expenses</Text>
        {recent.length === 0 ? (
          <Text style={styles.emptyText}>Nothing here yet</Text>
        ) : (
          recent.map((e) => (
            <View key={e.id} style={styles.expenseRow}>
              <View style={[styles.dot, { backgroundColor: CATEGORY_COLORS[e.category] }]} />
              <View style={styles.expenseInfo}>
                <Text style={styles.expenseDesc}>{e.description || e.category}</Text>
                <Text style={styles.expenseCat}>{e.category}</Text>
              </View>
              <Text style={styles.expenseAmount}>${e.amount.toFixed(2)}</Text>
            </View>
          ))
        )}
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddExpense')}
      >
        <Text style={styles.addButtonText}>+ Add Expense</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 32 },
  totalCard: {
    backgroundColor: '#4A90E2',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  totalLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  totalAmount: { color: '#fff', fontSize: 40, fontWeight: 'bold', marginTop: 4 },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12, color: '#222' },
  emptyChart: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: { color: '#999', fontSize: 14, textAlign: 'center' },
  emptySubtext: { color: '#bbb', fontSize: 12, marginTop: 4, textAlign: 'center' },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  expenseInfo: { flex: 1 },
  expenseDesc: { fontSize: 14, color: '#333', fontWeight: '500' },
  expenseCat: { fontSize: 12, color: '#999', marginTop: 2 },
  expenseAmount: { fontSize: 14, fontWeight: '600', color: '#333' },
  addButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
