ALTER TABLE sig_bookmark ADD lib_parent TEXT;

UPDATE sig_bookmark SET lib_parent = NULL;
UPDATE sig_bookmark SET lib_parent = "" WHERE ID_BM_PARENT = 0;

-- repeat below as long as it changes
UPDATE sig_bookmark AS parent LEFT JOIN sig_bookmark AS b ON b.ID_BM_PARENT = parent.ID_BM
  SET b.lib_parent = concat_ws(" xxxx ", NULLIF(replace(parent.LIB_BM, "Mes signets", ""), ""), NULLIF(parent.lib_parent, ""))
  WHERE b.lib_parent IS NULL AND parent.lib_parent IS NOT NULL;
