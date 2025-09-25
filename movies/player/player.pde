import oscP5.*;
import netP5.*;
import processing.video.*;
import java.io.File;
import java.io.FilenameFilter;

Movie A;
Movie B;
boolean flag = true;
OscP5 oscP5;

File currentMovieFile;
File folder;
void setup() {
  fullScreen(P3D);
  folder = new File("C:/Users/Presence/Desktop/presence/movies");
  cleanOldVideos();
  oscP5 = new OscP5(this, 8080);
  background(0);
}

void draw() {
  if (flag) {
    if (null != A) {
      image(A, 0, 0, width, height);
    }
  } else {
    if (null != B) {
      image(B, 0, 0, width, height);
    }
  }
}

void oscEvent(OscMessage theOscMessage) {
  flag = !flag;
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
  if (!flag) {
    if (null != currentMovieFile) {
      A.stop();
      A = null;
      currentMovieFile.delete();
    }
    currentMovieFile = getVideos()[0];
    B = new Movie(this, currentMovieFile.getAbsolutePath());
    B.loop();
  } else {
    if (null != currentMovieFile) {
      B.stop();
      B = null;
      currentMovieFile.delete();
    }
    currentMovieFile = getVideos()[0];
    A = new Movie(this, currentMovieFile.getAbsolutePath());
    A.loop();
  }
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
