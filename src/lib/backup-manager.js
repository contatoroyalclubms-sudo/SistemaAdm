/**
 * Backup Manager for WhatsApp Sessions
 */

const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');

class BackupManager {
  constructor(logger) {
    this.logger = logger;
    this.backupDir = path.resolve('./storage/backups');
    this.sessionDir = path.resolve('./storage/session');
    this.maxBackups = parseInt(process.env.MAX_BACKUPS) || 10;
    
    // Ensure backup directory exists
    fs.ensureDirSync(this.backupDir);
  }

  /**
   * Create backup of session files
   * @returns {Promise<Object>} Backup result
   */
  async createBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `session-backup-${timestamp}.zip`;
      const backupPath = path.join(this.backupDir, backupName);
      
      // Check if session directory exists and has files
      if (!await fs.pathExists(this.sessionDir)) {
        this.logger.warn('Session directory does not exist, skipping backup');
        return {
          success: false,
          message: 'Session directory does not exist',
          backupPath: null
        };
      }

      const sessionFiles = await fs.readdir(this.sessionDir);
      if (sessionFiles.length === 0) {
        this.logger.warn('Session directory is empty, skipping backup');
        return {
          success: false,
          message: 'Session directory is empty',
          backupPath: null
        };
      }

      // Create backup archive
      const output = fs.createWriteStream(backupPath);
      const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
      });

      output.on('close', () => {
        this.logger.info(`Backup created: ${backupPath} (${archive.pointer()} bytes)`);
      });

      archive.on('error', (err) => {
        this.logger.error('Backup archive error:', err);
        throw err;
      });

      archive.pipe(output);
      archive.directory(this.sessionDir, false);
      await archive.finalize();

      // Clean old backups
      await this.cleanOldBackups();

      return {
        success: true,
        message: 'Backup created successfully',
        backupPath,
        size: archive.pointer(),
        timestamp
      };
    } catch (error) {
      this.logger.error('Error creating backup:', error);
      return {
        success: false,
        message: 'Error creating backup',
        error: error.message,
        backupPath: null
      };
    }
  }

  /**
   * Restore backup
   * @param {string} backupPath - Path to backup file
   * @returns {Promise<Object>} Restore result
   */
  async restoreBackup(backupPath) {
    try {
      if (!await fs.pathExists(backupPath)) {
        return {
          success: false,
          message: 'Backup file not found'
        };
      }

      // Create temporary directory for extraction
      const tempDir = path.join(this.backupDir, 'temp-restore');
      await fs.ensureDir(tempDir);
      await fs.emptyDir(tempDir);

      // Extract backup
      const extract = require('extract-zip');
      await extract(backupPath, { dir: tempDir });

      // Backup current session (if exists)
      if (await fs.pathExists(this.sessionDir)) {
        const currentBackup = path.join(this.backupDir, `current-session-${Date.now()}.zip`);
        const currentArchive = archiver('zip');
        const currentOutput = fs.createWriteStream(currentBackup);
        
        currentArchive.pipe(currentOutput);
        currentArchive.directory(this.sessionDir, false);
        await currentArchive.finalize();
        
        this.logger.info(`Current session backed up to: ${currentBackup}`);
      }

      // Replace session directory
      await fs.remove(this.sessionDir);
      await fs.move(path.join(tempDir, 'session'), this.sessionDir);
      await fs.remove(tempDir);

      this.logger.info(`Backup restored from: ${backupPath}`);
      
      return {
        success: true,
        message: 'Backup restored successfully',
        restoredFrom: backupPath
      };
    } catch (error) {
      this.logger.error('Error restoring backup:', error);
      return {
        success: false,
        message: 'Error restoring backup',
        error: error.message
      };
    }
  }

  /**
   * Clean old backups
   * @returns {Promise<number>} Number of backups removed
   */
  async cleanOldBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files
        .filter(file => file.startsWith('session-backup-') && file.endsWith('.zip'))
        .map(file => ({
          name: file,
          path: path.join(this.backupDir, file),
          stats: fs.statSync(path.join(this.backupDir, file))
        }))
        .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());

      if (backupFiles.length <= this.maxBackups) {
        return 0;
      }

      const filesToRemove = backupFiles.slice(this.maxBackups);
      let removedCount = 0;

      for (const file of filesToRemove) {
        await fs.remove(file.path);
        this.logger.info(`Removed old backup: ${file.name}`);
        removedCount++;
      }

      return removedCount;
    } catch (error) {
      this.logger.error('Error cleaning old backups:', error);
      return 0;
    }
  }

  /**
   * List available backups
   * @returns {Promise<Array>} List of backups
   */
  async listBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files
        .filter(file => file.startsWith('session-backup-') && file.endsWith('.zip'))
        .map(file => {
          const filePath = path.join(this.backupDir, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            path: filePath,
            size: stats.size,
            created: stats.mtime,
            sizeFormatted: this.formatBytes(stats.size)
          };
        })
        .sort((a, b) => b.created.getTime() - a.created.getTime());

      return backupFiles;
    } catch (error) {
      this.logger.error('Error listing backups:', error);
      return [];
    }
  }

  /**
   * Get backup statistics
   * @returns {Promise<Object>} Backup statistics
   */
  async getBackupStats() {
    try {
      const backups = await this.listBackups();
      const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
      
      return {
        totalBackups: backups.length,
        totalSize: totalSize,
        totalSizeFormatted: this.formatBytes(totalSize),
        oldestBackup: backups.length > 0 ? backups[backups.length - 1].created : null,
        newestBackup: backups.length > 0 ? backups[0].created : null,
        maxBackups: this.maxBackups
      };
    } catch (error) {
      this.logger.error('Error getting backup stats:', error);
      return {
        totalBackups: 0,
        totalSize: 0,
        totalSizeFormatted: '0 B',
        oldestBackup: null,
        newestBackup: null,
        maxBackups: this.maxBackups
      };
    }
  }

  /**
   * Format bytes to human readable format
   * @param {number} bytes - Bytes to format
   * @returns {string} Formatted string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Schedule automatic backups
   * @param {number} intervalHours - Hours between backups
   */
  scheduleBackups(intervalHours = 24) {
    const intervalMs = intervalHours * 60 * 60 * 1000;
    
    setInterval(async () => {
      this.logger.info('Running scheduled backup...');
      const result = await this.createBackup();
      if (result.success) {
        this.logger.info('Scheduled backup completed successfully');
      } else {
        this.logger.error('Scheduled backup failed:', result.message);
      }
    }, intervalMs);

    this.logger.info(`Scheduled backups every ${intervalHours} hours`);
  }
}

module.exports = BackupManager;
