# Imaget Project AI Rules (Mantine v8 in Shadow DOM)
CRITICAL: You are building a React 18 UI inside a Chrome Extension Shadow DOM. Violating these 5 rules is a Fatal Error.
- 遵循第一性原理。

## 1. Portals (Local Ref ONLY)

* FORBIDDEN: `withinPortal={false}`, removing `overflow: hidden`, `document.querySelector`, or global `Portal.extend`.
* REQUIRED: Portals MUST use local React refs to stay inside Shadow DOM.
1. Setup: `const [portalNode, setPortalNode] = useState<HTMLDivElement | null>(null);`
2. Render sibling container: `<div ref={setPortalNode} style={{position: 'absolute', zIndex: 99999, inset: 0, pointerEvents: 'none'}} />`
3. Bind target: `<Select comboboxProps={{ portalProps: { target: portalNode || undefined } }} />` (Enable pointerEvents on portal children if needed).



## 2. 100% Mantine Components

* FORBIDDEN: Raw HTML (`div`, `span`, `button`, `ul`).
* REQUIRED: Layout via `<Group>`, `<Flex>`, `<Stack>`, `<Box>`, `<Container>`. Scroll via `<ScrollArea>`. Interactive via `<Button>`, `<ActionIcon>`. Text via `<Text>`, `<Title>`.

## 3. Zero External CSS

* FORBIDDEN: Custom `.css`/`.scss` files, or using `className`.
* REQUIRED (Priority 1): Mantine Style Props (`p="md"`, `bg="dark.8"`, `radius="lg"`). Use theme variables (xs, sm, md), NO hardcoded pixels for spacing.
* ALLOWED (Priority 2): Inline `style={{...}}` ONLY for advanced effects (e.g., `backdropFilter`, complex `boxShadow`).

## 4. Premium Dark Mode

* UI is strictly `defaultColorScheme="dark"`.
* FORBIDDEN: Hardcoded HEX colors (e.g., #fff, #333).
* REQUIRED: Use semantic colors (`c="dimmed"`, `c="bright"`). Create depth using `withBorder`, `shadow="sm|xl"`.

## 5. Architecture & Responsive

* FORBIDDEN: Mixing DOM scraping logic into `src/ui` components. Keep `src/core` and `src/ui` strictly separated.
* FORBIDDEN: `@media` queries.
* REQUIRED: Mantine responsive object syntax (e.g., `w={{ base: '100%', sm: '85vw' }}`).