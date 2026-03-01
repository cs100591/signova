# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - link "Signova" [ref=e4] [cursor=pointer]:
        - /url: /
    - generic [ref=e6]:
      - img [ref=e8]
      - generic [ref=e40]:
        - button "Sign In" [ref=e41]
        - button "Create Account" [ref=e42]
      - generic [ref=e43]:
        - heading "Welcome back" [level=1] [ref=e44]
        - paragraph [ref=e45]: Sign in to access your contracts
      - generic [ref=e46]:
        - generic [ref=e47]:
          - generic [ref=e48]: Email
          - generic [ref=e49]:
            - img [ref=e50]
            - textbox "you@example.com" [ref=e53]
        - generic [ref=e54]:
          - generic [ref=e55]: Password
          - generic [ref=e56]:
            - img [ref=e57]
            - textbox "••••••••" [ref=e60]
            - button [ref=e61]:
              - img [ref=e62]
        - button "Sign In" [ref=e65]:
          - text: Sign In
          - img [ref=e66]
      - link "Forgot your password?" [ref=e69] [cursor=pointer]:
        - /url: "#"
    - contentinfo [ref=e70]:
      - link "← Back to home" [ref=e71] [cursor=pointer]:
        - /url: /
  - alert [ref=e72]
```