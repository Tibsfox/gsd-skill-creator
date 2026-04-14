' ============================================================
' Pic2Html — Reconstructed from .NET IL metadata
' Original: D:\Documents and Settings\foxglove\My Documents\
'           Visual Studio 2005\Projects\Pic2Html\Pic2Html
' Built: June 3, 2007 | VB.NET 2005 | .NET Framework 2.0
' Author: foxglove
' ============================================================
' Decompiled from PE32 .NET assembly (32,768 bytes)
' Method signatures and field names extracted from metadata.
' String literals were built via String.Format (not stored
' in the #US heap), so the HTML template is reconstructed
' from the GetPixel → Color → Format → Write call chain.
' ============================================================

Imports System.Drawing
Imports System.IO
Imports System.Text
Imports System.Windows.Forms

Public Class Main
    Inherits Form

    ' --- Controls (from metadata) ---
    Friend WithEvents Button1 As Button          ' "Open Image"
    Friend WithEvents Button3 As Button          ' "Save HTML"
    Friend WithEvents OpenFileDialog1 As OpenFileDialog
    Friend WithEvents SaveFileDialog1 As SaveFileDialog
    Friend WithEvents Label1 As Label
    Friend WithEvents Label3 As Label
    Friend WithEvents Label5 As Label
    Friend WithEvents LabelX As Label             ' shows image width
    Friend WithEvents LabelY As Label             ' shows image height

    ' --- Fields (from metadata) ---
    Private bitmap As Bitmap
    Private bitmap_width As Integer
    Private bitmap_hight As Integer               ' original spelling preserved
    Private bitmap_location As String
    Private htmloutput As String

    ' --- Button1_Click: Open an image file ---
    Private Sub Button1_Click(ByVal sender As Object, ByVal e As EventArgs) Handles Button1.Click
        If OpenFileDialog1.ShowDialog() = DialogResult.OK Then
            bitmap_location = OpenFileDialog1.FileName
            bitmap = New Bitmap(bitmap_location)
            bitmap_width = bitmap.Width
            bitmap_hight = bitmap.Height
            LabelX.Text = bitmap_width.ToString()
            LabelY.Text = bitmap_hight.ToString()
        End If
    End Sub

    ' --- Button3_Click: Convert image to HTML and save ---
    Private Sub Button3_Click(ByVal sender As Object, ByVal e As EventArgs) Handles Button3.Click
        If bitmap Is Nothing Then Return

        ' Build HTML table where each pixel becomes a colored cell
        ' The Format call and GetPixel loop are confirmed from IL metadata.
        ' The exact HTML template is reconstructed from the call pattern:
        '   bitmap.GetPixel(x, y) → Color → String.Format → htmloutput
        '
        ' The division at offset 7867 suggests percentage-based sizing:
        '   (x / bitmap_width) and similar for progress or cell sizing

        Dim sb As New StringBuilder()
        ' Confirmed from AAAAAAAA.html output:
        '   - Cell size: 24x24 px (width=24 height=24)
        '   - Colors: 6-digit hex without # prefix
        '   - Black page background, white table default
        '   - One <td> per line, <tr height=24> per row

        sb.AppendLine("<html>")
        sb.AppendLine("<body bgcolor=000000>")
        sb.AppendLine("<table border=0 cellpadding=0 cellspacing=0 bgcolor=ffffff>")

        For y As Integer = 0 To bitmap_hight - 1
            sb.AppendLine("<tr height=24> ")
            For x As Integer = 0 To bitmap_width - 1
                Dim c As Color = bitmap.GetPixel(x, y)
                sb.AppendFormat("<td width=24 bgcolor=""{0:x2}{1:x2}{2:x2}""></td>", c.R, c.G, c.B)
                sb.AppendLine()
            Next
            sb.AppendLine("</tr>")
        Next

        sb.AppendLine("</table>")
        sb.AppendLine("</body>")
        sb.AppendLine("</html>")

        htmloutput = sb.ToString()

        ' Save to file
        If SaveFileDialog1.ShowDialog() = DialogResult.OK Then
            Dim stream As Stream = SaveFileDialog1.OpenFile()
            Dim writer As New StreamWriter(stream)
            writer.Write(htmloutput)
            writer.Close()
            stream.Close()
        End If
    End Sub

End Class
