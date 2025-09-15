BEGIN;

-- Таблица задач
CREATE TABLE IF NOT EXISTS tasks (
    id          BIGSERIAL   PRIMARY KEY,
    title       TEXT        NOT NULL CHECK (length(btrim(title)) > 0),
    body        TEXT        NOT NULL DEFAULT '',
    done        BOOLEAN     NOT NULL DEFAULT false,
    priority    TEXT        NOT NULL DEFAULT 'medium'
                 CHECK (priority IN ('low','medium','high')),
    due_at      TIMESTAMPTZ NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Индексы под частые фильтры/сортировки
CREATE INDEX IF NOT EXISTS idx_tasks_done       ON tasks(done);
CREATE INDEX IF NOT EXISTS idx_tasks_due_at     ON tasks(due_at);
CREATE INDEX IF NOT EXISTS idx_tasks_priority   ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);

-- Функция и триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tasks_updated ON tasks;
CREATE TRIGGER trg_tasks_updated
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

COMMIT;
