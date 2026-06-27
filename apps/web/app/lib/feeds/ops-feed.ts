/**
 * Ops feed — the provider-neutral seam between the access stream and whatever
 * central bucket(s) we choose. Access-stream tool handlers import from here,
 * never from a specific provider, so the central planner can be swapped without
 * touching tool contracts or the agent.
 *
 * Today this delegates to the Lightfield adapter. Tomorrow it could fan out to
 * several sources or a different aggregator.
 */

import {
  createNote,
  createTask,
  lightfieldConfigured,
  listAccounts,
  listContacts,
  listMeetings,
  listMembers,
  listTasks,
  type FeedAccount,
  type FeedContact,
  type FeedMeeting,
  type FeedMember,
  type FeedTask,
} from "./lightfield";

export type { FeedAccount, FeedContact, FeedMeeting, FeedMember, FeedTask };

export const opsFeed = {
  name: "lightfield",
  isConfigured(): boolean {
    return lightfieldConfigured();
  },
  listMeetings,
  listAccounts,
  listContacts,
  listMembers,
  listTasks,
  createNote,
  createTask,
};
