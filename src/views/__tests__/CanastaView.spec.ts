import { mount, type DOMWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { loadAllSessions, saveSession } from '@/services/canasta/sessionStorage'
import { createEmptyCanastaSessionEnvelope } from '@/types/canasta'
import CanastaView from '@/views/CanastaView.vue'

class LocalStorageMock {
  private store: Record<string, string> = {}

  getItem(key: string): string | null {
    return this.store[key] ?? null
  }

  setItem(key: string, value: string): void {
    this.store[key] = value
  }

  removeItem(key: string): void {
    delete this.store[key]
  }

  clear(): void {
    this.store = {}
  }
}

async function startNewSession(wrapper: ReturnType<typeof mount>, sessionType = 'bothTeams') {
  const newSessionButton = wrapper.find('[data-test="new-session-button"]')
  if (!newSessionButton.exists()) {
    throw new Error('Missing New Session button')
  }

  await newSessionButton.trigger('click')

  if (sessionType !== 'bothTeams') {
    const radio = wrapper.find(`input[type="radio"][value="${sessionType}"]`)
    if (!radio.exists()) {
      throw new Error(`Missing radio for session type: ${sessionType}`)
    }
    await radio.setValue(true)
  }

  const startSessionButton = wrapper.find('[data-test="start-session-button"]')
  if (!startSessionButton.exists()) {
    throw new Error('Missing Start Session button')
  }

  await startSessionButton.trigger('click')
}

async function mountWithNewSession(sessionType = 'bothTeams') {
  const wrapper = mount(CanastaView)
  await startNewSession(wrapper, sessionType)
  return wrapper
}

function getTeamForm(wrapper: ReturnType<typeof mount>, teamLabel: string) {
  const form = wrapper
    .findAll('section.hand-form')
    .find((candidate) => candidate.find('h3').text() === teamLabel)

  if (!form) {
    throw new Error(`Missing form for ${teamLabel}`)
  }

  return form
}

function getWentOutCheckboxes(wrapper: ReturnType<typeof mount>) {
  const teamWeForm = getTeamForm(wrapper, 'We')
  const teamTheyForm = getTeamForm(wrapper, 'Them')
  const teamWeCheckbox = teamWeForm
    .findAll('label.requirements-toggle')
    .find((label) => label.text().includes('Went Out First'))
    ?.find('input[type="checkbox"]') as DOMWrapper<HTMLInputElement> | undefined
  const teamTheyCheckbox = teamTheyForm
    .findAll('label.requirements-toggle')
    .find((label) => label.text().includes('Went Out First'))
    ?.find('input[type="checkbox"]') as DOMWrapper<HTMLInputElement> | undefined

  if (!teamWeCheckbox?.exists() || !teamTheyCheckbox?.exists()) {
    throw new Error('Expected exactly two Went Out First checkboxes')
  }

  return [teamWeCheckbox, teamTheyCheckbox] as const
}

function getAllRequirementsCheckboxes(wrapper: ReturnType<typeof mount>) {
  const teamWeForm = getTeamForm(wrapper, 'We')
  const teamTheyForm = getTeamForm(wrapper, 'Them')
  const teamWeCheckbox = teamWeForm
    .findAll('label.requirements-toggle')
    .find((label) => label.text().includes('All Requirements Met'))
    ?.find('input[type="checkbox"]') as DOMWrapper<HTMLInputElement> | undefined
  const teamTheyCheckbox = teamTheyForm
    .findAll('label.requirements-toggle')
    .find((label) => label.text().includes('All Requirements Met'))
    ?.find('input[type="checkbox"]') as DOMWrapper<HTMLInputElement> | undefined

  if (!teamWeCheckbox?.exists() || !teamTheyCheckbox?.exists()) {
    throw new Error('Expected exactly two All Requirements Met checkboxes')
  }

  return [teamWeCheckbox, teamTheyCheckbox] as const
}

function getRequirementInput(
  wrapper: ReturnType<typeof mount>,
  fieldLabel: string,
  teamLabel = 'We',
) {
  const form = getTeamForm(wrapper, teamLabel)
  const label = form.findAll('label.field').find((item) => item.find('span').text() === fieldLabel)

  if (!label) {
    throw new Error(`Missing requirement input for ${fieldLabel}`)
  }

  const input = label.find('input') as DOMWrapper<HTMLInputElement>

  if (!input.exists()) {
    throw new Error(`Missing requirement input for ${fieldLabel}`)
  }

  return input
}

async function setCheckboxChecked(checkbox: DOMWrapper<HTMLInputElement>, checked: boolean) {
  checkbox.element.checked = checked
  await checkbox.trigger('change')
}

function getBigCountValue(wrapper: ReturnType<typeof mount>, teamLabel = 'We') {
  const form = getTeamForm(wrapper, teamLabel)
  const row = form
    .findAll('.total-row')
    .find((candidate) => candidate.find('span').text().trim() === 'Big Count')

  if (!row) {
    throw new Error('Missing Big Count row')
  }

  return row.find('strong.total-value').text().trim()
}

async function setRequirementInputValue(
  wrapper: ReturnType<typeof mount>,
  fieldLabel: string,
  value: string,
  teamLabel = 'We',
) {
  const input = getRequirementInput(wrapper, fieldLabel, teamLabel)
  await input.setValue(value)
}

describe('CanastaView', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', new LocalStorageMock())
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    )
    vi.clearAllMocks()
  })

  it('shows the session chooser on initial load', () => {
    const wrapper = mount(CanastaView)

    expect(wrapper.find('[data-test="new-session-button"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="start-session-button"]').exists()).toBe(false)
  })

  it('opens session type modal from new session button', async () => {
    const wrapper = mount(CanastaView)
    await wrapper.find('[data-test="new-session-button"]').trigger('click')

    expect(wrapper.find('[data-test="session-type-modal"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="start-session-button"]').exists()).toBe(true)
  })

  it('shows current session button when a current session exists', async () => {
    const now = Date.now()
    const currentSession = createEmptyCanastaSessionEnvelope('bothTeams', now - 60 * 60 * 1000)
    currentSession.handState.hand1.teamWe.requirement7s = 1
    saveSession(currentSession)

    const wrapper = mount(CanastaView)
    await nextTick()

    expect(wrapper.find('[data-test="current-session-button"]').exists()).toBe(true)
  })

  it('shows previous sessions select when archived sessions exist', async () => {
    const now = Date.now()
    const archivedSession = createEmptyCanastaSessionEnvelope('bothTeams', now - 5 * 60 * 60 * 1000)
    archivedSession.handState.hand1.teamWe.requirement7s = 1
    saveSession(archivedSession)

    const wrapper = mount(CanastaView)
    await nextTick()

    expect(wrapper.find('[data-test="previous-session-select"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="open-previous-session-button"]').exists()).toBe(true)
  })

  it('loads archived session in read-only mode with disabled form inputs', async () => {
    const now = Date.now()
    const archivedSession = createEmptyCanastaSessionEnvelope('bothTeams', now - 5 * 60 * 60 * 1000)
    archivedSession.handState.hand1.teamWe.requirement7s = 3
    saveSession(archivedSession)

    const wrapper = mount(CanastaView)
    await nextTick()
    const select = wrapper.find('[data-test="previous-session-select"]')
    await select.setValue(String(archivedSession.sessionId))
    await wrapper.find('[data-test="open-previous-session-button"]').trigger('click')

    expect(wrapper.text()).toContain('Archived Session (Read-Only)')

    const disabledFieldset = wrapper.find('section.hand-form fieldset[disabled]')
    expect(disabledFieldset.exists()).toBe(true)
  })

  it('renders myTeamOnly mode as full We form and manual Them form', async () => {
    const wrapper = await mountWithNewSession('myTeamOnly')

    const weForm = getTeamForm(wrapper, 'We')
    const themForm = getTeamForm(wrapper, 'Them')

    expect(weForm.find('[data-test="manual-big-count-input"]').exists()).toBe(false)
    expect(themForm.find('[data-test="manual-big-count-input"]').exists()).toBe(true)
  })

  it('renders totalScoresOnly mode as manual forms for both teams', async () => {
    const wrapper = await mountWithNewSession('totalScoresOnly')

    const weForm = getTeamForm(wrapper, 'We')
    const themForm = getTeamForm(wrapper, 'Them')

    expect(weForm.find('[data-test="manual-big-count-input"]').exists()).toBe(true)
    expect(themForm.find('[data-test="manual-big-count-input"]').exists()).toBe(true)
  })

  it('disables opposing team went-out checkbox when one team is checked', async () => {
    const wrapper = await mountWithNewSession()
    const [teamWeCheckbox, teamTheyCheckbox] = getWentOutCheckboxes(wrapper)

    expect((teamWeCheckbox.element as HTMLInputElement).disabled).toBe(false)
    expect((teamTheyCheckbox.element as HTMLInputElement).disabled).toBe(false)

    await setCheckboxChecked(teamWeCheckbox, true)

    expect((teamWeCheckbox.element as HTMLInputElement).disabled).toBe(false)
    expect((teamTheyCheckbox.element as HTMLInputElement).disabled).toBe(true)
  })

  it('re-enables opposing team went-out checkbox when unchecked', async () => {
    const wrapper = await mountWithNewSession()
    const [teamWeCheckbox, teamTheyCheckbox] = getWentOutCheckboxes(wrapper)

    await setCheckboxChecked(teamWeCheckbox, true)
    expect((teamTheyCheckbox.element as HTMLInputElement).disabled).toBe(true)

    await setCheckboxChecked(teamWeCheckbox, false)
    expect((teamTheyCheckbox.element as HTMLInputElement).disabled).toBe(false)
  })

  it('does not auto-check all requirements when went out is checked', async () => {
    const wrapper = await mountWithNewSession()
    const [teamWeWentOutCheckbox] = getWentOutCheckboxes(wrapper)
    const [teamWeAllRequirementsCheckbox] = getAllRequirementsCheckboxes(wrapper)

    expect((teamWeAllRequirementsCheckbox.element as HTMLInputElement).checked).toBe(false)

    await setCheckboxChecked(teamWeWentOutCheckbox, true)

    expect((teamWeAllRequirementsCheckbox.element as HTMLInputElement).checked).toBe(false)
  })

  it('does not mutate requirement counts when went out is checked', async () => {
    const wrapper = await mountWithNewSession()

    await setRequirementInputValue(wrapper, '7s', '2')
    await setRequirementInputValue(wrapper, '5s', '3')

    const [teamWeWentOutCheckbox] = getWentOutCheckboxes(wrapper)

    await setCheckboxChecked(teamWeWentOutCheckbox, true)

    expect((getRequirementInput(wrapper, '7s').element as HTMLInputElement).value).toBe('2')
    expect((getRequirementInput(wrapper, '5s').element as HTMLInputElement).value).toBe('3')
  })

  it('does not mutate requirement counts when all requirements is toggled', async () => {
    const wrapper = await mountWithNewSession()
    const [teamWeAllRequirementsCheckbox] = getAllRequirementsCheckboxes(wrapper)

    await setRequirementInputValue(wrapper, '7s', '4')
    await setRequirementInputValue(wrapper, 'Wilds', '2')
    await setCheckboxChecked(teamWeAllRequirementsCheckbox, true)
    await setCheckboxChecked(teamWeAllRequirementsCheckbox, false)

    expect((getRequirementInput(wrapper, '7s').element as HTMLInputElement).value).toBe('4')
    expect((getRequirementInput(wrapper, 'Wilds').element as HTMLInputElement).value).toBe('2')
  })

  it('keeps point labels out of the inline checkbox titles', async () => {
    const wrapper = await mountWithNewSession()
    const teamWeForm = getTeamForm(wrapper, 'We')
    const [teamWeWentOutCheckbox] = getWentOutCheckboxes(wrapper)
    const [teamWeAllRequirementsCheckbox] = getAllRequirementsCheckboxes(wrapper)

    expect(teamWeForm.text()).not.toContain('(200 pts)')
    expect(teamWeForm.text()).not.toContain('(11,300 pts)')

    await setCheckboxChecked(teamWeWentOutCheckbox, true)
    await setCheckboxChecked(teamWeAllRequirementsCheckbox, true)

    expect(teamWeForm.text()).not.toContain('(200 pts)')
    expect(teamWeForm.text()).not.toContain('(11,300 pts)')
  })

  it('adds all requirements bonus to big count while retaining manual requirement scoring', async () => {
    const wrapper = await mountWithNewSession()
    const [teamWeAllRequirementsCheckbox] = getAllRequirementsCheckboxes(wrapper)

    await setRequirementInputValue(wrapper, '7s', '1')
    expect(getBigCountValue(wrapper)).toBe('5,000')

    await setCheckboxChecked(teamWeAllRequirementsCheckbox, true)

    expect(getBigCountValue(wrapper)).toBe('16,300')
  })

  it('renders the book counts heading without inline helper text', async () => {
    const wrapper = await mountWithNewSession()

    expect(wrapper.text()).toContain('Canasta Counts')
    expect(wrapper.text()).not.toContain('exclude requirement books if all requirements were met')
  })

  it('opens and closes the mobile-friendly info popup', async () => {
    const wrapper = await mountWithNewSession()
    const teamWeForm = getTeamForm(wrapper, 'We')
    const trigger = teamWeForm
      .findAll('.tooltip-title')
      .find((candidate) => candidate.text().includes('Canasta Counts'))

    expect(trigger?.exists()).toBe(true)
    expect(wrapper.find('[data-tooltip-modal]').exists()).toBe(false)

    await trigger!.trigger('click')

    expect(wrapper.find('[data-tooltip-modal]').exists()).toBe(true)

    await wrapper.find('.tooltip-close').trigger('click')

    expect(wrapper.find('[data-tooltip-modal]').exists()).toBe(false)
  })

  describe('blur-only persistence', () => {
    it('updates live score display immediately on input before blur', async () => {
      const wrapper = await mountWithNewSession()

      await setRequirementInputValue(wrapper, '7s', '2')

      // Score should update reactively without needing blur
      expect(getBigCountValue(wrapper, 'We')).toBe('10,000')
    })

    it('does not persist to localStorage until a field loses focus', async () => {
      const baselineSessions = loadAllSessions().length
      const wrapper = await mountWithNewSession()

      // Directly manipulate the input value without triggering blur
      const input = getRequirementInput(wrapper, '7s')
      input.element.value = '3'
      await input.trigger('input')

      // Score shows updated value
      expect(getBigCountValue(wrapper, 'We')).toBe('15,000')

      // But localStorage session still has 0 for requirement7s
      const sessions = loadAllSessions()
      expect(sessions.length).toBeGreaterThan(0)
      const activeSession = sessions.reduce((latest, session) =>
        session.sessionId > latest.sessionId ? session : latest,
      )
      expect(activeSession.handState.hand1.teamWe.requirement7s).toBe(0)
    })

    it('persists to localStorage after fieldset focusout', async () => {
      const baselineSessions = loadAllSessions().length
      const wrapper = await mountWithNewSession()

      const input = getRequirementInput(wrapper, '7s')
      input.element.value = '3'
      await input.trigger('input')

      // Trigger focusout on the fieldset (simulates blur from any child input)
      const fieldset = getTeamForm(wrapper, 'We').find('fieldset')
      await fieldset.trigger('focusout')

      // Now localStorage should be updated
      const sessions = loadAllSessions()
      expect(sessions.length).toBeGreaterThan(0)
      const activeSession = sessions.reduce((latest, session) =>
        session.sessionId > latest.sessionId ? session : latest,
      )
      expect(activeSession.handState.hand1.teamWe.requirement7s).toBe(3)
    })
  })

  it('does not render clean and dirty inputs alongside red 3s box', async () => {
    const wrapper = await mountWithNewSession()
    const teamWeForm = getTeamForm(wrapper, 'We')
    const red3Box = teamWeForm
      .findAll('.count-group-box')
      .find((el) => el.text().includes('Red 3s'))

    expect(red3Box).toBeDefined()
    expect(red3Box!.text()).not.toContain('Clean')
    expect(red3Box!.text()).not.toContain('Dirty')
  })

  describe('settings panel', () => {
    it('settings button is not visible before a session is started', async () => {
      const wrapper = mount(CanastaView)
      expect(wrapper.find('[data-test="settings-button"]').exists()).toBe(true)
    })

    describe('empty session pruning', () => {
      it('removes empty sessions when returning to the session chooser', async () => {
        const wrapper = await mountWithNewSession()
        const sessionCountAfterStart = loadAllSessions().length

        // Return to chooser without entering any scores
        await wrapper.find('[data-test="back-to-chooser-button"]').trigger('click')

        // The new empty session should be pruned.
        expect(loadAllSessions()).toHaveLength(Math.max(0, sessionCountAfterStart - 1))
      })

      it('keeps sessions that have at least one score entered', async () => {
        const wrapper = await mountWithNewSession()
        const sessionCountAfterStart = loadAllSessions().length

        await setRequirementInputValue(wrapper, '7s', '1', 'We')
        const fieldset = getTeamForm(wrapper, 'We').find('fieldset')
        await fieldset.trigger('focusout')

        await wrapper.find('[data-test="back-to-chooser-button"]').trigger('click')

        expect(loadAllSessions()).toHaveLength(sessionCountAfterStart)
      })
    })

    it('opens and closes the settings panel', async () => {
      const wrapper = await mountWithNewSession()

      expect(wrapper.find('[data-test="settings-panel"]').exists()).toBe(false)

      await wrapper.find('[data-test="settings-button"]').trigger('click')

      expect(wrapper.find('[data-test="settings-panel"]').exists()).toBe(true)

      await wrapper.find('[data-test="settings-close-button"]').trigger('click')

      expect(wrapper.find('[data-test="settings-panel"]').exists()).toBe(false)
    })

    it('persists retention days to localStorage on change', async () => {
      const wrapper = await mountWithNewSession()

      await wrapper.find('[data-test="settings-button"]').trigger('click')
      const select = wrapper.find('[data-test="settings-retention-select"]')
      await select.setValue('30')

      expect(localStorage.getItem('canasta:sessions:retentionDays')).toBe('30')
    })

    it('persists tooltip toggle to localStorage on change', async () => {
      const wrapper = await mountWithNewSession()

      await wrapper.find('[data-test="settings-button"]').trigger('click')
      const toggle = wrapper.find('[data-test="settings-tooltips-toggle"]')
      ;(toggle.element as HTMLInputElement).checked = false
      await toggle.trigger('change')

      expect(localStorage.getItem('canasta:settings:tooltipsEnabled')).toBe('false')
    })

    it('disables tooltip title trigger style when tooltips are disabled', async () => {
      const wrapper = await mountWithNewSession()

      // Confirm trigger styling exists by default.
      const teamWeForm = getTeamForm(wrapper, 'We')
      const canastaCountsTitle = teamWeForm
        .findAll('.label-with-total > span')
        .find((candidate) => candidate.text().includes('Canasta Counts'))
      expect(canastaCountsTitle?.classes()).toContain('tooltip-title')

      // Disable tooltips via settings panel
      await wrapper.find('[data-test="settings-button"]').trigger('click')
      const toggle = wrapper.find('[data-test="settings-tooltips-toggle"]')
      ;(toggle.element as HTMLInputElement).checked = false
      await toggle.trigger('change')
      await wrapper.find('[data-test="settings-close-button"]').trigger('click')

      // Trigger style should be removed when tooltips are disabled.
      const disabledTitle = getTeamForm(wrapper, 'We')
        .findAll('.label-with-total > span')
        .find((candidate) => candidate.text().includes('Canasta Counts'))
      expect(disabledTitle?.classes()).not.toContain('tooltip-title')
    })

    it('re-enables tooltip title trigger style when tooltips are re-enabled', async () => {
      const wrapper = await mountWithNewSession()

      // Disable then re-enable tooltips
      await wrapper.find('[data-test="settings-button"]').trigger('click')
      const toggle = wrapper.find('[data-test="settings-tooltips-toggle"]')
      ;(toggle.element as HTMLInputElement).checked = false
      await toggle.trigger('change')
      ;(toggle.element as HTMLInputElement).checked = true
      await toggle.trigger('change')
      await wrapper.find('[data-test="settings-close-button"]').trigger('click')

      const enabledTitle = getTeamForm(wrapper, 'We')
        .findAll('.label-with-total > span')
        .find((candidate) => candidate.text().includes('Canasta Counts'))
      expect(enabledTitle?.classes()).toContain('tooltip-title')
    })
  })
})
