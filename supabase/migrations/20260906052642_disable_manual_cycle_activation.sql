revoke execute on function public.activate_cycle(uuid, uuid) from authenticated;

comment on function public.activate_cycle(uuid, uuid) is
  'Internal cycle activation primitive. Do not expose to authenticated clients until the confirmed import workflow invokes it safely.';
