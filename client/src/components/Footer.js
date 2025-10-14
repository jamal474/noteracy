import '../styles/Footer.css'

const Footer = () => {
    var d = new Date(); 
    const currentYear = d.getFullYear(); 
  return (
    <div className = "footer">
        <div className  = "c">&copy;{currentYear}</div>
        <a href="https://github.com/jamal474/NoteracyApp" className = "github">github</a>
        <a href="https://www.linkedin.com/in/md-shabbir-jamal-0620781a0/" className = "linkedin">linkedin</a>
    </div>
  )
}

export default Footer