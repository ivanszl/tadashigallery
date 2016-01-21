CREATE TABLE `folders` (
  `id` mediumint(8) unsigned NOT NULL AUTO_INCREMENT,
  `folder_name` varchar(30) NOT NULL,
  `parent_id` mediumint(6) unsigned NOT NULL,
  `created_at` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `parent_id` (`parent_id`),
  KEY `created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

CREATE TABLE `files` (
  `file_id` char(32) NOT NULL,
  `title` varchar(60) NOT NULL,
  `file_ext` varchar(5) NOT NULL,
  `file_path` char(38) NOT NULL,
  `file_size` int(10) unsigned NOT NULL,
  `created_at` int(10) unsigned NOT NULL,
  PRIMARY KEY (`file_id`),
  KEY `created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `folder_files` (
  `folder_id` mediumint(6) unsigned NOT NULL,
  `file_id` char(32) NOT NULL,
  PRIMARY KEY (`folder_id`,`file_id`),
  KEY `file_fk` (`file_id`),
  CONSTRAINT `file_fk` FOREIGN KEY (`file_id`) REFERENCES `t_files` (`file_id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `folder_fk` FOREIGN KEY (`folder_id`) REFERENCES `t_folders` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8;