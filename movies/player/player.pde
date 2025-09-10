import oscP5.*;
import netP5.*;
import processing.video.*;
import java.io.File;
import java.io.FilenameFilter;

Movie movie;
OscP5 oscP5;

File currentMovieFile;
File folder;
void setup() {
  size(1920, 1080);
  folder = new File(sketchPath("../rec"));
  cleanOldVideos();
  oscP5 = new OscP5(this, 8080);
  background(0);
}

void draw() {
  if (null != movie) {
    image(movie, 0, 0, width, height);
  }
}

void oscEvent(OscMessage theOscMessage) {
  if (theOscMessage.checkAddrPattern("/play")) {
    if (theOscMessage.checkTypetag("s")) {
      loadLastVideo();
    }
  }
  if (theOscMessage.checkAddrPattern("/kill")) {
    exit();
  }
}

void loadLastVideo() {
  if (null != currentMovieFile) {
    movie.stop();
    movie = null;
    currentMovieFile.delete();
  }
  currentMovieFile = getVideos()[0];
  movie = new Movie(this, currentMovieFile.getAbsolutePath());
  movie.loop();
}


void movieEvent(Movie m) {
  m.read();
}

void cleanOldVideos() {
  for (File f : getVideos()) {
    f.delete();
  }
}

File[] getVideos() {
  return folder.listFiles(new FilenameFilter() {
    public boolean accept(File dir, String name) {
      return name.toLowerCase().endsWith(".mp4");
    }
  }
  );
}
