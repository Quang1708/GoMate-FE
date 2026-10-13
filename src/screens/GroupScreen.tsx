import { ComponentProps, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '../components/LocalizedText';
import { GradientButton } from '../components/GradientButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { Activity } from '../data/activities';
import { MembersPanel } from './MembershipViews';
import { getSession } from '../services/api';
import { colors, layout, radii } from '../theme';

type GroupTab = 'chat' | 'plan' | 'expenses' | 'members';
type IconName = ComponentProps<typeof Ionicons>['name'];

const tabs: { id: GroupTab; label: string; icon: IconName }[] = [
  { id: 'chat', label: 'Chat', icon: 'chatbubble-outline' },
  { id: 'plan', label: 'Kế hoạch', icon: 'list-outline' },
  { id: 'expenses', label: 'Chi phí', icon: 'wallet-outline' },
  { id: 'members', label: 'Thành viên', icon: 'people-outline' },
];

export function GroupScreen({ activity, onBack, onStart, onLeft }: { activity: Activity; onBack: () => void; onStart: () => void; onLeft: () => void }) {
  const [tab, setTab] = useState<GroupTab>('chat');
  const [message, setMessage] = useState('');
  const [sentMessages, setSentMessages] = useState<string[]>([]);
  const [checked, setChecked] = useState<Set<number>>(() => new Set([0]));

  const send = () => {
    const clean = message.trim();
    if (!clean) return;
    setSentMessages((current) => [...current, clean]);
    setMessage('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader onBack={onBack} subtitle={activity.time} title={activity.title} />
      <View style={styles.tabs}>
        {tabs.map((item) => <Pressable key={item.id} onPress={() => setTab(item.id)} style={[styles.tab, tab === item.id && styles.activeTab]}><Ionicons color={tab === item.id ? colors.primary : colors.textMuted} name={item.icon} size={17} /><Text style={[styles.tabText, tab === item.id && styles.activeTabText]}>{item.label}</Text></Pressable>)}
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.page}>
          {tab === 'chat' && <ChatTab sentMessages={sentMessages} />}
          {tab === 'plan' && <PlanTab activity={activity} checked={checked} onToggle={(index) => setChecked((current) => { const next = new Set(current); if (next.has(index)) next.delete(index); else next.add(index); return next; })} />}
          {tab === 'expenses' && <ExpensesTab />}
          {tab === 'members' && <MembersPanel activity={activity} onLeft={onLeft} />}
          {activity.hostId === getSession()?.user.id && <GradientButton label="Bắt đầu hoạt động" onPress={onStart} style={styles.startButton} trailing={<Ionicons color={colors.white} name="play" size={18} />} />}
        </View>
      </ScrollView>
      {tab === 'chat' && <View style={styles.composer}><TextInput onChangeText={setMessage} placeholder="Nhắn cho cả nhóm..." placeholderTextColor={colors.textMuted} style={styles.input} value={message} /><Pressable onPress={send} style={styles.send}><Ionicons color={colors.white} name="send" size={18} /></Pressable></View>}
    </SafeAreaView>
  );
}

function ChatTab({ sentMessages }: { sentMessages: string[] }) {
  return <View><Text style={styles.date}>Hôm nay</Text><Bubble text="Mình đã cập nhật điểm tập trung trong phần Kế hoạch nhé!" /><Bubble mine text="Mình đã xem, hẹn gặp mọi người." />{sentMessages.map((item, index) => <Bubble key={`${item}-${index}`} mine text={item} />)}</View>;
}

function Bubble({ text, mine = false }: { text: string; mine?: boolean }) {
  return <View style={[styles.bubble, mine ? styles.myBubble : styles.theirBubble]}><Text style={[styles.bubbleText, mine && styles.myBubbleText]}>{text}</Text></View>;
}

function PlanTab({ activity, checked, onToggle }: { activity: Activity; checked: Set<number>; onToggle: (index: number) => void }) {
  const tasks = ['Xác nhận điểm tập trung', 'Chuẩn bị vật dụng cá nhân', 'Kiểm tra thời tiết'];
  return <View><Card title="Lịch trình">{activity.plan.map((item, index) => <View key={item} style={styles.timelineRow}><View style={styles.timelineDot}><Text style={styles.timelineIndex}>{index + 1}</Text></View><Text style={styles.rowText}>{item}</Text></View>)}</Card><Card title="Checklist">{tasks.map((item, index) => <Pressable key={item} onPress={() => onToggle(index)} style={styles.checkRow}><Ionicons color={checked.has(index) ? colors.success : colors.textMuted} name={checked.has(index) ? 'checkbox' : 'square-outline'} size={21} /><Text style={[styles.rowText, checked.has(index) && styles.done]}>{item}</Text></Pressable>)}</Card><Card title="Bình chọn"><Text style={styles.pollQuestion}>Sau hoạt động, cả nhóm muốn ăn ở đâu?</Text><View style={styles.pollOption}><Text style={styles.pollText}>Quán gần địa điểm</Text><Text style={styles.pollCount}>3 phiếu</Text></View><View style={styles.pollOption}><Text style={styles.pollText}>Tự chọn sau</Text><Text style={styles.pollCount}>1 phiếu</Text></View></Card></View>;
}

function ExpensesTab() {
  return <View><View style={styles.balanceCard}><Text style={styles.balanceLabel}>Tổng chi phí nhóm</Text><Text style={styles.balanceValue}>480.000đ</Text><Text style={styles.balanceNote}>Bạn cần thanh toán 120.000đ</Text></View><Card title="Chi phí"><Expense name="Đặt sân / địa điểm" amount="320.000đ" paid="Tuấn Kiệt đã trả" /><Expense name="Nước uống" amount="160.000đ" paid="Minh Anh đã trả" /></Card><Pressable style={styles.outlineButton}><Ionicons color={colors.primary} name="add" size={18} /><Text style={styles.outlineText}>Thêm chi phí</Text></Pressable></View>;
}

function Expense({ name, amount, paid }: { name: string; amount: string; paid: string }) {
  return <View style={styles.expenseRow}><View style={styles.expenseIcon}><Ionicons color={colors.primary} name="receipt-outline" size={18} /></View><View style={styles.expenseCopy}><Text style={styles.expenseName}>{name}</Text><Text style={styles.expensePaid}>{paid}</Text></View><Text style={styles.expenseAmount}>{amount}</Text></View>;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <View style={styles.card}><Text style={styles.cardTitle}>{title}</Text>{children}</View>;
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  tabs: { backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', paddingHorizontal: 8 },
  tab: { alignItems: 'center', borderBottomColor: 'transparent', borderBottomWidth: 2, flex: 1, gap: 3, paddingBottom: 9, paddingTop: 8 },
  activeTab: { borderBottomColor: colors.primary },
  tabText: { color: colors.textMuted, fontSize: 9.5, fontWeight: '700' },
  activeTabText: { color: colors.primary },
  content: { paddingBottom: 26 },
  page: { alignSelf: 'center', maxWidth: layout.maxWidth, padding: 16, width: '100%' },
  date: { color: colors.textMuted, fontSize: 10, marginBottom: 15, textAlign: 'center' },
  bubble: { borderRadius: 18, marginBottom: 10, maxWidth: '82%', paddingHorizontal: 14, paddingVertical: 11 },
  theirBubble: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderTopLeftRadius: 6 },
  myBubble: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderTopRightRadius: 6 },
  bubbleText: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  myBubbleText: { color: colors.white },
  composer: { alignItems: 'center', backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 1, flexDirection: 'row', gap: 9, padding: 12 },
  input: { backgroundColor: colors.background, borderRadius: 20, color: colors.text, flex: 1, minHeight: 42, paddingHorizontal: 14 },
  send: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 21, height: 42, justifyContent: 'center', width: 42 },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.card, borderWidth: 1, marginBottom: 13, padding: 16 },
  cardTitle: { color: colors.text, fontSize: 15, fontWeight: '900', marginBottom: 12 },
  timelineRow: { alignItems: 'center', flexDirection: 'row', marginBottom: 11 },
  timelineDot: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 12, height: 25, justifyContent: 'center', width: 25 },
  timelineIndex: { color: colors.primary, fontSize: 10, fontWeight: '900' },
  rowText: { color: colors.textSecondary, flex: 1, fontSize: 12.5, marginLeft: 9 },
  checkRow: { alignItems: 'center', flexDirection: 'row', minHeight: 38 },
  done: { textDecorationLine: 'line-through' },
  pollQuestion: { color: colors.text, fontSize: 13, fontWeight: '700', marginBottom: 9 },
  pollOption: { backgroundColor: colors.background, borderRadius: 13, flexDirection: 'row', justifyContent: 'space-between', marginTop: 7, padding: 11 },
  pollText: { color: colors.textSecondary, fontSize: 11.5 },
  pollCount: { color: colors.primary, fontSize: 10.5, fontWeight: '800' },
  balanceCard: { backgroundColor: colors.primary, borderRadius: radii.largeCard, marginBottom: 13, padding: 20 },
  balanceLabel: { color: 'rgba(255,255,255,0.78)', fontSize: 11 },
  balanceValue: { color: colors.white, fontSize: 28, fontWeight: '900', marginTop: 5 },
  balanceNote: { color: colors.white, fontSize: 11.5, marginTop: 12 },
  expenseRow: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', paddingVertical: 11 },
  expenseIcon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 12, height: 36, justifyContent: 'center', width: 36 },
  expenseCopy: { flex: 1, marginLeft: 10 },
  expenseName: { color: colors.text, fontSize: 12.5, fontWeight: '800' },
  expensePaid: { color: colors.textMuted, fontSize: 9.5, marginTop: 3 },
  expenseAmount: { color: colors.text, fontSize: 12, fontWeight: '800' },
  outlineButton: { alignItems: 'center', borderColor: colors.primary, borderRadius: radii.button, borderWidth: 1, flexDirection: 'row', justifyContent: 'center', minHeight: 50 },
  outlineText: { color: colors.primary, fontSize: 13, fontWeight: '800', marginLeft: 6 },
  memberRow: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', paddingVertical: 10 },
  avatar: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 20, height: 40, justifyContent: 'center', width: 40 },
  avatarText: { color: colors.primary, fontSize: 14, fontWeight: '900' },
  memberCopy: { flex: 1, marginLeft: 10 },
  memberName: { color: colors.text, fontSize: 12.5, fontWeight: '800' },
  memberRole: { color: colors.textMuted, fontSize: 9.5, marginTop: 3 },
  startButton: { marginTop: 4 },
});
