import type { Engine } from 'claude-code/testing'
import { expect, mock, test } from 'claude-code/testing'

const run = async ($: Engine, command: string, args: string) =>
  // The engine stamps origin and presentation; the test kit's type still names them.
  (await $.command.run({ command, args } as Parameters<Engine['command']['run']>[0])).text

test('/autohandoff stores a threshold and turns off', async ($, on) => {
  mock.store(on)
  expect(await run($, 'autohandoff', '80k')).toBe('Autohandoff at 80k tokens.')
  expect(await run($, 'autohandoff', '')).toBe('Autohandoff at 80k tokens.')
  expect(await run($, 'autohandoff', 'off')).toBe('Autohandoff off.')
  expect(await run($, 'autohandoff', '')).toBe('Autohandoff is off. Usage: /autohandoff 80k')
})

test('/cache-ttl sets a manual TTL and auto clears it', async ($, on) => {
  mock.store(on)
  expect(await run($, 'cache-ttl', '5')).toBe('Cache TTL set to 5m.')
  expect(await run($, 'cache-ttl', '')).toBe('Cache TTL 5m (manual). Usage: /cache-ttl <minutes|auto>')
  await run($, 'cache-ttl', 'auto')
  expect(await run($, 'cache-ttl', '')).toBe('Cache TTL 60m (config). Usage: /cache-ttl <minutes|auto>')
})
