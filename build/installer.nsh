!macro customInstall
  ; Create "Start with Windows" registry entry
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "OVERSEER" "$INSTDIR\OVERSEER.exe"
!macroend

!macro customUnInstall
  ; Remove "Start with Windows" registry entry
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "OVERSEER"
!macroend
