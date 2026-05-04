import { mount, type DOMWrapper } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import CanastaView from '@/views/CanastaView.vue'

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
  const teamAForm = getTeamForm(wrapper, 'We')
  const teamBForm = getTeamForm(wrapper, 'Them')
  const teamACheckbox = teamAForm
    .findAll('label.requirements-toggle')
    .find((label) => label.text().includes('Went Out First'))
    ?.find('input[type="checkbox"]') as DOMWrapper<HTMLInputElement> | undefined
  const teamBCheckbox = teamBForm
    .findAll('label.requirements-toggle')
    .find((label) => label.text().includes('Went Out First'))
    ?.find('input[type="checkbox"]') as DOMWrapper<HTMLInputElement> | undefined

  if (!teamACheckbox?.exists() || !teamBCheckbox?.exists()) {
    throw new Error('Expected exactly two Went Out First checkboxes')
  }

  return [teamACheckbox, teamBCheckbox] as const
}

function getAllRequirementsCheckboxes(wrapper: ReturnType<typeof mount>) {
  const teamAForm = getTeamForm(wrapper, 'We')
  const teamBForm = getTeamForm(wrapper, 'Them')
  const teamACheckbox = teamAForm
    .findAll('label.requirements-toggle')
    .find((label) => label.text().includes('All Requirements Met'))
    ?.find('input[type="checkbox"]') as DOMWrapper<HTMLInputElement> | undefined
  const teamBCheckbox = teamBForm
    .findAll('label.requirements-toggle')
    .find((label) => label.text().includes('All Requirements Met'))
    ?.find('input[type="checkbox"]') as DOMWrapper<HTMLInputElement> | undefined

  if (!teamACheckbox?.exists() || !teamBCheckbox?.exists()) {
    throw new Error('Expected exactly two All Requirements Met checkboxes')
  }

  return [teamACheckbox, teamBCheckbox] as const
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
  it('disables opposing team went-out checkbox when one team is checked', async () => {
    const wrapper = mount(CanastaView)
    const [teamACheckbox, teamBCheckbox] = getWentOutCheckboxes(wrapper)

    expect((teamACheckbox.element as HTMLInputElement).disabled).toBe(false)
    expect((teamBCheckbox.element as HTMLInputElement).disabled).toBe(false)

    await setCheckboxChecked(teamACheckbox, true)

    expect((teamACheckbox.element as HTMLInputElement).disabled).toBe(false)
    expect((teamBCheckbox.element as HTMLInputElement).disabled).toBe(true)
  })

  it('re-enables opposing team went-out checkbox when unchecked', async () => {
    const wrapper = mount(CanastaView)
    const [teamACheckbox, teamBCheckbox] = getWentOutCheckboxes(wrapper)

    await setCheckboxChecked(teamACheckbox, true)
    expect((teamBCheckbox.element as HTMLInputElement).disabled).toBe(true)

    await setCheckboxChecked(teamACheckbox, false)
    expect((teamBCheckbox.element as HTMLInputElement).disabled).toBe(false)
  })

  it('does not auto-check all requirements when went out is checked', async () => {
    const wrapper = mount(CanastaView)
    const [teamAWentOutCheckbox] = getWentOutCheckboxes(wrapper)
    const [teamAAllRequirementsCheckbox] = getAllRequirementsCheckboxes(wrapper)

    expect((teamAAllRequirementsCheckbox.element as HTMLInputElement).checked).toBe(false)

    await setCheckboxChecked(teamAWentOutCheckbox, true)

    expect((teamAAllRequirementsCheckbox.element as HTMLInputElement).checked).toBe(false)
  })

  it('does not mutate requirement counts when went out is checked', async () => {
    const wrapper = mount(CanastaView)

    await setRequirementInputValue(wrapper, '7s', '2')
    await setRequirementInputValue(wrapper, '5s', '3')

    const [teamAWentOutCheckbox] = getWentOutCheckboxes(wrapper)

    await setCheckboxChecked(teamAWentOutCheckbox, true)

    expect((getRequirementInput(wrapper, '7s').element as HTMLInputElement).value).toBe('2')
    expect((getRequirementInput(wrapper, '5s').element as HTMLInputElement).value).toBe('3')
  })

  it('does not mutate requirement counts when all requirements is toggled', async () => {
    const wrapper = mount(CanastaView)
    const [teamAAllRequirementsCheckbox] = getAllRequirementsCheckboxes(wrapper)

    await setRequirementInputValue(wrapper, '7s', '4')
    await setRequirementInputValue(wrapper, 'Wilds', '2')
    await setCheckboxChecked(teamAAllRequirementsCheckbox, true)
    await setCheckboxChecked(teamAAllRequirementsCheckbox, false)

    expect((getRequirementInput(wrapper, '7s').element as HTMLInputElement).value).toBe('4')
    expect((getRequirementInput(wrapper, 'Wilds').element as HTMLInputElement).value).toBe('2')
  })

  it('keeps point labels out of the inline checkbox titles', async () => {
    const wrapper = mount(CanastaView)
    const teamAForm = getTeamForm(wrapper, 'We')
    const [teamAWentOutCheckbox] = getWentOutCheckboxes(wrapper)
    const [teamAAllRequirementsCheckbox] = getAllRequirementsCheckboxes(wrapper)

    expect(teamAForm.text()).not.toContain('(200 pts)')
    expect(teamAForm.text()).not.toContain('(11,300 pts)')

    await setCheckboxChecked(teamAWentOutCheckbox, true)
    await setCheckboxChecked(teamAAllRequirementsCheckbox, true)

    expect(teamAForm.text()).not.toContain('(200 pts)')
    expect(teamAForm.text()).not.toContain('(11,300 pts)')
  })

  it('adds all requirements bonus to big count while retaining manual requirement scoring', async () => {
    const wrapper = mount(CanastaView)
    const [teamAAllRequirementsCheckbox] = getAllRequirementsCheckboxes(wrapper)

    await setRequirementInputValue(wrapper, '7s', '1')
    expect(getBigCountValue(wrapper)).toBe('5,000')

    await setCheckboxChecked(teamAAllRequirementsCheckbox, true)

    expect(getBigCountValue(wrapper)).toBe('16,300')
  })

  it('renders the book counts heading without inline helper text', () => {
    const wrapper = mount(CanastaView)

    expect(wrapper.text()).toContain('Canasta Counts')
    expect(wrapper.text()).not.toContain('exclude requirement books if all requirements were met')
  })

  it('opens and closes the mobile-friendly info popup', async () => {
    const wrapper = mount(CanastaView)
    const teamAForm = getTeamForm(wrapper, 'We')
    const trigger = teamAForm.find('[data-tooltip-trigger="canastaCounts"]')

    expect(trigger.exists()).toBe(true)
    expect(wrapper.find('[data-tooltip-modal]').exists()).toBe(false)

    await trigger.trigger('click')

    expect(wrapper.find('[data-tooltip-modal]').exists()).toBe(true)

    await wrapper.find('.tooltip-close').trigger('click')

    expect(wrapper.find('[data-tooltip-modal]').exists()).toBe(false)
  })

  it('does not render clean and dirty inputs alongside red 3s box', () => {
    const wrapper = mount(CanastaView)
    const teamAForm = getTeamForm(wrapper, 'We')
    const red3Box = teamAForm.findAll('.count-group-box').find((el) => el.text().includes('Red 3s'))

    expect(red3Box).toBeDefined()
    expect(red3Box!.text()).not.toContain('Clean')
    expect(red3Box!.text()).not.toContain('Dirty')
  })
})
