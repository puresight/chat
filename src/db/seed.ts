import type { Channel, Message, Participant } from './types';

export const SELF_ID = 'self';

export const PARTICIPANTS: Participant[] = [
  { id: 'u-maya', name: 'Maya Chen', role: 'Product Designer' },
  { id: 'u-devon', name: 'Devon Park', role: 'Frontend Engineer' },
  { id: 'u-aisha', name: 'Aisha Okafor', role: 'Engineering Lead' },
  { id: 'u-lucas', name: 'Lucas Meyer', role: 'Backend Engineer' },
  { id: 'u-priya', name: 'Priya Sharma', role: 'QA Engineer' },
  { id: 'u-support', name: 'Nova Support', role: 'Customer Success' },
];
export const MIN = 60_000;
export const HOUR = 3_600_000;
export const DAY = 86_400_000;

export function buildSeedData(): { channels: Channel[]; messages: Message[] } {
  const now = Date.now();
  const channels: Channel[] = [];
  const messages: Message[] = [];

  const mk = (
    ch: Pick<Channel, 'workspaceId' | 'type' | 'name' | 'participantIds'> &
      Partial<Pick<Channel, 'isArchived' | 'unreadCount' | 'avatarUrl' | 'topic'>>,
    msgs: Array<{ from: string; text: string; minutesAgo: number; status?: Message['status']; linkedTaskId?: string; linkedEventId?: string }>
  ) => {
    const id = crypto.randomUUID();
    const last = msgs[msgs.length - 1];
    channels.push({
      isArchived: false,
      unreadCount: 0,
      ...ch,
      id,
      avatarUrl: ch.avatarUrl ?? null,
      topic: ch.topic ?? null,
      lastMessageSnippet: last?.text ?? null,
      lastMessageAt: now - last.minutesAgo * MIN,
      isDeleted: false,
      synced: 1 as const,
      createdAt: now - 7 * DAY,
      updatedAt: now - last.minutesAgo * MIN,
    });
    for (const m of msgs) {
      messages.push({
        id: crypto.randomUUID(),
        channelId: id,
        senderId: m.from,
        content: m.text,
        status: m.status ?? (m.from === SELF_ID ? 'read' : 'delivered'),
        linkedTaskId: m.linkedTaskId ?? null,
        linkedEventId: m.linkedEventId ?? null,
        isDeleted: false,
        synced: 1 as const,
        createdAt: now - m.minutesAgo * MIN,
        updatedAt: now - m.minutesAgo * MIN,
      });
    }
  };

  mk(
    {
      workspaceId: 'ws-local',
      type: 'direct',
      name: 'Maya Chen',
      participantIds: [SELF_ID, 'u-maya'],
    },
    [
      { from: 'u-maya', text: 'Hey! Did you get a chance to look at the new onboarding flow?', minutesAgo: 64 },
      { from: SELF_ID, text: 'Yes — just finished going through it. The progress indicator is a big improvement.', minutesAgo: 52 },
      { from: 'u-maya', text: 'Right? I think we can ship it Friday if QA signs off.', minutesAgo: 50 },
      { from: SELF_ID, text: 'Agreed. I will ping Priya this afternoon to schedule a pass.', minutesAgo: 47 },
      { from: 'u-maya', text: 'Perfect. Also small thing — can we tweak the button copy to "Get started"?', minutesAgo: 2, status: 'delivered' },
      { from: 'u-maya', text: 'Here is the spec so far:\n\n- Bold headline with **Get started**\n- Subtext in *italic*\n- Code: `onSubmit`\n\nDetails: https://example.com/spec', minutesAgo: 1, status: 'delivered' },
    ]
  );

  mk(
    {
      workspaceId: 'ws-local',
      type: 'group',
      name: 'Dev Team / Project Sync',
      topic: 'Sync engine milestone — demo Thursday',
      participantIds: [SELF_ID, 'u-devon', 'u-aisha', 'u-lucas', 'u-priya'],
    },
    [
      { from: 'u-aisha', text: 'Morning all. Standup notes: the sync engine milestone is due Thursday.', minutesAgo: 210 },
      { from: 'u-devon', text: 'Finished the offline queue last night — writes now persist before the network layer sees them.', minutesAgo: 180 },
      { from: 'u-lucas', text: 'Nice. Server reconciliation endpoint is up, accepting batched updates.', minutesAgo: 165 },
      { from: SELF_ID, text: 'Great progress. I will wire the UI to show the synced flag today.', minutesAgo: 140 },
      { from: 'u-priya', text: 'I prepared a regression checklist for the conflict cases, will share in the doc.', minutesAgo: 90 },
      { from: 'u-aisha', text: 'Excellent. Let us keep the demo to a 20 minute slot so we have time for questions.', minutesAgo: 15, status: 'delivered' },
      { from: 'u-devon', text: 'Added the remaining pieces to the board:', minutesAgo: 9, linkedTaskId: 'exo-01jk7sh2-task-71be' },
      { from: 'u-aisha', text: 'Perfect. Calendar invite for the milestone demo is out:', minutesAgo: 6, linkedEventId: 'evt-01jk7sh2-demo-1024' },
    ]
  );

  mk(
    {
      workspaceId: 'ws-local',
      type: 'direct',
      name: 'Nova Support',
      participantIds: [SELF_ID, 'u-support'],
    },
    [
      { from: 'u-support', text: 'Hello! Thanks for contacting Nova Support. Your ticket #4821 is confirmed.', minutesAgo: 1_500 },
      { from: 'u-support', text: 'Please attach the export file mentioned in step 3 so we can reproduce the issue.', minutesAgo: 1_480 },
      { from: SELF_ID, text: 'Here you go.', minutesAgo: 1_400, status: 'read' },
      { from: 'u-support', text: 'onboarding-export-2026.zip', minutesAgo: 1_395 },
      { from: 'u-support', text: 'Received, thanks! Our engineers will follow up within one business day.', minutesAgo: 1_390 },
      { from: 'u-support', text: 'I created a tracking ticket so you can follow progress. You can also join the QA session in the calendar.', minutesAgo: 1_380, linkedTaskId: 'exo-01jk7sh2-task-4c8d', linkedEventId: 'evt-01jk7sh2-qa-1021' },
    ]
  );

  return { channels, messages };
}
