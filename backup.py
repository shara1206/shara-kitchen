#!/usr/bin/env python3
"""
backup.py — Food recipe backup tool
Usage:
  python backup.py save "描述这次改动"   # 保存一个新快照
  python backup.py list                  # 列出所有快照
  python backup.py restore <snapshot>    # 恢复某个快照（输入 list 显示的编号或名称）

快照存在 .backups/ 目录，保留最近 10 个版本。
备份整个 Food 目录（除 .backups/ 本身外的所有文件）。
"""

import os, sys, shutil, json
from datetime import datetime

FOOD_DIR   = os.path.dirname(os.path.abspath(__file__))
BACKUP_DIR = os.path.join(FOOD_DIR, ".backups")
META_FILE  = os.path.join(BACKUP_DIR, "meta.json")
KEEP       = 10
EXCLUDE_DIRS = {".backups", ".git"}


def load_meta():
    if os.path.exists(META_FILE):
        with open(META_FILE, encoding="utf-8") as f:
            return json.load(f)
    return []


def save_meta(meta):
    with open(META_FILE, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)


def cmd_save(label="manual save"):
    os.makedirs(BACKUP_DIR, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    snap_name = ts
    snap_dir  = os.path.join(BACKUP_DIR, snap_name)
    os.makedirs(snap_dir)

    count = 0
    for entry in os.listdir(FOOD_DIR):
        src = os.path.join(FOOD_DIR, entry)
        if os.path.isdir(src) and entry not in EXCLUDE_DIRS:
            shutil.copytree(src, os.path.join(snap_dir, entry))
            count += sum(len(fs) for _, _, fs in os.walk(src))
        elif os.path.isfile(src):
            shutil.copy2(src, snap_dir)
            count += 1

    meta = load_meta()
    meta.append({"snapshot": snap_name, "label": label, "time": ts, "files": count})
    save_meta(meta)  # 先存：保证 meta 与磁盘一致，即使下面 prune 失败也不会丢记录

    while len(meta) > KEEP:
        old = meta.pop(0)
        old_dir = os.path.join(BACKUP_DIR, old["snapshot"])
        try:
            if os.path.isdir(old_dir):
                shutil.rmtree(old_dir)
                print(f"  pruned old snapshot: {old['snapshot']}")
        except OSError as e:
            # 某些环境（如 Cowork 挂载盘）禁止删除，跳过而不是崩溃
            print(f"  ⚠ 无法删除旧快照 {old['snapshot']}（权限限制），已跳过: {e}")
            meta.insert(0, old)  # 删不掉就放回，让 meta 继续与磁盘一致
            break

    save_meta(meta)
    print(f"✅ Snapshot saved: {snap_name}  ({count} files)  — {label}")


def cmd_list():
    meta = load_meta()
    if not meta:
        print("No snapshots found.")
        return
    print(f"\n{'#':<4} {'Time':<18} {'Label':<35} {'Files'}")
    print("-" * 65)
    for i, m in enumerate(meta):
        t = datetime.strptime(m["time"], "%Y%m%d_%H%M%S").strftime("%Y-%m-%d %H:%M:%S")
        print(f"{i+1:<4} {t:<18} {m['label']:<35} {m['files']}")
    print()


def cmd_restore(target):
    meta = load_meta()
    snap = None

    if target.isdigit():
        idx = int(target) - 1
        if 0 <= idx < len(meta):
            snap = meta[idx]
    else:
        for m in meta:
            if m["snapshot"] == target:
                snap = m
                break

    if not snap:
        print(f"❌ Snapshot '{target}' not found. Run 'python backup.py list' to see options.")
        sys.exit(1)

    snap_dir = os.path.join(BACKUP_DIR, snap["snapshot"])
    confirm = input(f"Restore snapshot #{meta.index(snap)+1} — {snap['label']} ({snap['time']})? [y/N] ")
    if confirm.lower() != "y":
        print("Cancelled.")
        return

    for entry in os.listdir(snap_dir):
        src = os.path.join(snap_dir, entry)
        dst = os.path.join(FOOD_DIR, entry)
        if os.path.isdir(src):
            shutil.rmtree(dst, ignore_errors=True)
            shutil.copytree(src, dst)
        else:
            shutil.copy2(src, FOOD_DIR)

    print(f"✅ Restored: {snap['snapshot']} — {snap['label']}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(0)

    cmd = sys.argv[1].lower()
    if cmd == "save":
        label = " ".join(sys.argv[2:]) or "manual save"
        cmd_save(label)
    elif cmd == "list":
        cmd_list()
    elif cmd == "restore":
        if len(sys.argv) < 3:
            print("Usage: python backup.py restore <number or snapshot name>")
            sys.exit(1)
        cmd_restore(sys.argv[2])
    else:
        print(__doc__)
