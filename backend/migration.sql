-- AlterTable
ALTER TABLE "themes" DROP COLUMN "drive_folder_id";
ALTER TABLE "themes" DROP COLUMN "drive_webview_link";
ALTER TABLE "themes" ADD COLUMN "local_folder_path" TEXT NOT NULL DEFAULT '';
