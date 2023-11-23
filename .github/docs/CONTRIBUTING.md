# Tài liệu hướng dẫn đóng góp

## Các bước đóng góp

- Không commit thẳng lên main
- Không commit thẳng lên develop

1. Tạo branch mới từ develop
2. Commit code lên branch mới
3. Tạo pull request từ branch mới lên develop

## Các bước đóng góp chi tiết

### 1. Tạo branch mới từ develop

- Tạo branch mới từ develop

- Tên branch phải có dạng: `<category>/<reference>/<description-in-kebab-case>`
  - Trong đó:
    - category: `feature`, `bugfix`, `hotfix`, `refactor`, `style`, `test`, `doc`
    - reference: `issue/ticket`, `pr`, `no-ref`
    - description-in-kebab-case: mô tả ngắn gọn về nội dung thay đổi, viết thường, cách nhau bởi dấu `-`
- vd: `git branch feature/issue-42/create-new-button-component`
- vd: `git branch bugfix/issue-342/button-overlap-form-on-mobile`
- vd: `git branch bugfix/pr-42/fix-button-component`

### 2. Commit code lên branch mới

- Commit code lên branch mới

- Tên commit phải có dạng: `<category: do something; do some other things>`

  - Trong đó:
    - category: `feat`, `fix`, `refactor`, `chore`

- `feat` is for adding a new feature
- `fix` is for fixing a bug
- `refactor` is for changing code for performance or convenience purpose (e.g. readability)
- `chore` is for everything else (writing documentation, formatting, adding tests, cleaning useless code etc.)

- vd: `git commit -m "feat: add new button component; add new button components to templates"`
- vd: `git commit -m 'fix: add the stop directive to button component to prevent propagation'`
- vd: `git commit -m 'refactor: rewrite button component in TypeScript'`
- vd: `git commit -m 'chore: write button documentation'`

### 3. Tạo pull request từ branch mới lên develop
