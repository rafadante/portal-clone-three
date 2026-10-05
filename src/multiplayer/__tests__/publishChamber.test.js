import { publishChamber } from '../../chambers/publishChamber';

const input = { user: { id: 'owner', email: 'test@example.test', user_metadata: { full_name: 'Test' } }, name: ' My chamber ', blob: 'zip', thumb: 'image' };
function mockClient(uploadError = null, insertError = null) {
  const upload = jest.fn().mockResolvedValue({ error: uploadError });
  const insert = jest.fn().mockResolvedValue({ error: insertError });
  return { storage: { from: jest.fn(() => ({ upload })) }, from: jest.fn(() => ({ insert })), upload, insert };
}
test('missing name or session is rejected before upload', async () => {
  const client = mockClient();
  await expect(publishChamber(client, { ...input, name: undefined })).rejects.toThrow('Enter a chamber name');
  await expect(publishChamber(client, { ...input, name: '  ' })).rejects.toThrow('Enter a chamber name');
  await expect(publishChamber(client, { ...input, user: null })).rejects.toThrow('Sign in');
  expect(client.storage.from).not.toHaveBeenCalled();
});
test('failed file upload prevents creation of a broken chamber record', async () => {
  const client = mockClient({ message: 'Bucket not found', code: '404' });
  await expect(publishChamber(client, input)).rejects.toThrow('Could not upload the chamber file: Bucket not found (404)');
  expect(client.insert).not.toHaveBeenCalled();
});
test('database errors identify the failing stage and preserve the actual message', async () => {
  const client = mockClient(null, { message: 'Permission denied', code: '42501' });
  await expect(publishChamber(client, input)).rejects.toThrow('File uploaded, but the chamber record could not be saved: Permission denied (42501)');
});
test('successful publication stores a trimmed name and the uploaded file path', async () => {
  const client = mockClient();
  await expect(publishChamber(client, input)).resolves.toBeUndefined();
  expect(client.insert).toHaveBeenCalledWith([expect.objectContaining({ name: 'My chamber', user_id: 'owner', path: client.upload.mock.calls[0][0] })]);
});
test('failed lookup during update never attempts to access a missing path', async () => {
  const client = mockClient();
  const query = { select: () => query, eq: () => query, single: async () => ({ data: null, error: { message: 'Not found' } }) };
  client.from.mockReturnValue(query);
  await expect(publishChamber(client, { ...input, id: 'existing' })).rejects.toThrow('Could not find your chamber: Not found');
  expect(client.upload).not.toHaveBeenCalled();
});
