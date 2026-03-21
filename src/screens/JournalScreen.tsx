import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {Ionicons} from '@react-native-vector-icons/ionicons';
import {useJournal, JournalEntry} from '../hooks/useJournal';
import {useHabits} from '../hooks/useHabits';
import {useTags} from '../hooks/useTags';
import {CheckInHistoryItem} from '../components/checkin/CheckInHistoryItem';
import {HabitCompletionItem} from '../components/journal/HabitCompletionItem';
import {colors, commonStyles} from '../theme';

export function JournalScreen() {
  const navigation = useNavigation<any>();
  const {sections, loading, loadingMore, hasMore, loadInitial, loadMore} =
    useJournal();
  const {allTagLabels, loadAllTagLabels} = useTags();
  const [tagsLoading, setTagsLoading] = useState(false);
  const {habits, loading: habitsLoading, loadHabits} = useHabits();

  useFocusEffect(
    useCallback(() => {
      setTagsLoading(true);
      loadAllTagLabels().then(() => setTagsLoading(false));
      loadHabits();
      loadInitial();
    }, [loadAllTagLabels, loadHabits, loadInitial]),
  );

  const renderItem = useCallback(
    ({item}: {item: JournalEntry}) => {
      if (item.type === 'checkin') {
        return (
          <CheckInHistoryItem
            checkIn={item.data}
            tagLabels={allTagLabels}
            compact
          />
        );
      }
      const habit = habits.find(h => h.id === item.data.habitId);
      return <HabitCompletionItem completion={item.data} habit={habit} />;
    },
    [allTagLabels, habits],
  );

  const renderSectionHeader = useCallback(
    ({section}: {section: {title: string; isGap: boolean}}) => {
      if (section.isGap) {
        return (
          <View style={styles.gapHeader}>
            <Text style={styles.gapText}>{section.title}</Text>
          </View>
        );
      }
      return (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>{section.title}</Text>
        </View>
      );
    },
    [],
  );

  const listHeader = (
    <View>
      <TouchableOpacity
        style={styles.analyticsButton}
        onPress={() => navigation.navigate('Home', {screen: 'Analytics'})}>
        <Ionicons name="bar-chart-outline" size={18} color={colors.primary} />
        <Text style={styles.analyticsButtonText}>View Analytics</Text>
      </TouchableOpacity>
    </View>
  );

  const listFooter = loadingMore ? (
    <ActivityIndicator style={styles.footer} color={colors.primary} />
  ) : null;

  const listEmpty = !loading ? (
    <Text style={styles.emptyText}>No journal entries yet</Text>
  ) : null;

  if (loading || tagsLoading || habitsLoading) {
    return (
      <View style={styles.loadingContainer}>
        {listHeader}
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.loadingIndicator}
        />
      </View>
    );
  }

  return (
    <SectionList
      style={styles.container}
      sections={sections}
      keyExtractor={(item, index) =>
        item.type === 'checkin'
          ? `checkin-${item.data.id}`
          : `habit-${item.data.id}-${index}`
      }
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      ListHeaderComponent={listHeader}
      ListFooterComponent={listFooter}
      ListEmptyComponent={listEmpty}
      onEndReached={hasMore ? loadMore : undefined}
      onEndReachedThreshold={0.5}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={styles.contentContainer}
      testID="journal-screen"
    />
  );
}

const styles = StyleSheet.create({
  container: commonStyles.screenContainer,
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  loadingContainer: {
    ...commonStyles.screenContainer,
  },
  loadingIndicator: {
    marginTop: 48,
  },
  analyticsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  analyticsButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  sectionHeader: {
    backgroundColor: colors.background,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  sectionHeaderText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  gapHeader: {
    paddingVertical: 12,
  },
  gapText: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  footer: {
    paddingVertical: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 15,
    marginTop: 48,
  },
});
