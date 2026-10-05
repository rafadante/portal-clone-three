import { v4 as uuidv4 } from 'uuid';

function check(error, stage) {
  if (error) throw new Error(`${stage}: ${error.message || 'Unknown error'}${error.code ? ` (${error.code})` : ''}`);
}

export async function publishChamber(client, { user, name, blob, thumb, id }) {
  if (!user?.id) throw new Error('Sign in before publishing a chamber.');
  name = typeof name === 'string' ? name.trim() : '';
  if (!name) throw new Error('Enter a chamber name in the editor before publishing.');
  const storage = client.storage.from('json');
  if (id) {
    const { data: chamber, error: lookupError } = await client.from('chambers')
      .select('path').eq('id', id).eq('user_id', user.id).single();
    check(lookupError, 'Could not find your chamber');
    if (!chamber?.path) throw new Error('The chamber has no saved file path.');
    const { error: uploadError } = await storage.update(chamber.path, blob, { cacheControl: '3600', upsert: false });
    check(uploadError, 'Could not upload the chamber file');
    const { data, error } = await client.from('chambers').update({ thumb, tested: false, name })
      .eq('id', id).eq('user_id', user.id).select('id');
    check(error, 'File uploaded, but chamber details could not be updated');
    if (!data?.length) throw new Error('File uploaded, but no chamber details were updated. Check your permissions.');
  } else {
    const path = `${user.id}/${uuidv4()}`;
    const { error: uploadError } = await storage.upload(path, blob, { upsert: false });
    check(uploadError, 'Could not upload the chamber file');
    const { error } = await client.from('chambers').insert([{
      path, user_id: user.id, email: user.email, thumb, tested: false, name,
      author: user.user_metadata?.full_name || user.user_metadata?.name || 'Anonymous',
    }]);
    check(error, 'File uploaded, but the chamber record could not be saved');
  }
}
